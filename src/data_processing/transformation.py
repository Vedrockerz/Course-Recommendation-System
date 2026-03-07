import sys
import os
import re
import numpy as np
import pandas as pd

from src.utils.exception import CustomException
from src.utils.logger import logging
from src.config import DataConfig


class DataTransformation:

	def __init__(self):
		self.config = DataConfig()

	def _normalize_udemy(self, df_udemy: pd.DataFrame) -> pd.DataFrame:
		df = df_udemy.copy()

		drop_columns = [
			"id",
			"num_published_lectures",
			"created",
			"last_update_date",
			"instructors_id",
		]
		df.drop(columns=drop_columns, inplace=True, errors="ignore")

		df.rename(
			columns={
				"title": "course_title",
				"num_reviews": "reviewcount",
				"rating": "rating",
				"duration": "duration",
				"url": "course_url",
				"image": "image",
			},
			inplace=True,
		)

		df["platform"] = "Udemy"
		df["skills"] = ""
		df["description"] = ""
		df["level"] = "All Levels"

		return df

	def _normalize_coursera(self, df_coursera: pd.DataFrame) -> pd.DataFrame:
		df = df_coursera.copy()

		drop_columns = [
			"Unnamed: 0",
			"enrolled",
			"Instructor",
			"Organization",
			"Modules/Courses",
			"Satisfaction Rate",
		]
		df.drop(columns=drop_columns, inplace=True, errors="ignore")

		df.rename(
			columns={
				"title": "course_title",
				"num_reviews": "reviewcount",
				"rating": "rating",
				"Schedule": "duration",
				"URL": "course_url",
				"Skills": "skills",
				"Description": "description",
				"Level": "level",
			},
			inplace=True,
		)

		df["platform"] = "Coursera"
		df["image"] = np.nan

		return df

	@staticmethod
	def _to_float(value):
		if pd.isna(value):
			return np.nan

		text = str(value).strip()

		if text == "":
			return np.nan

		text = text.replace(",", "")

		if text.lower() in {"rating not found", "enrollment number not found", "not found"}:
			return np.nan

		match = re.search(r"(\d+\.?\d*)", text)
		if match:
			return float(match.group(1))

		return np.nan

	@staticmethod
	def _clean_duration(value):
		if pd.isna(value):
			return np.nan

		text = str(value).lower().strip()

		if text == "":
			return np.nan

		match = re.search(r"(\d+\.?\d*)\s*total\s*hours?", text)
		if match:
			return float(match.group(1))

		match = re.search(r"(\d+\.?\d*)\s*total\s*mins?", text)
		if match:
			return float(match.group(1)) / 60

		match = re.search(r"(\d+\.?\d*)\s*hours?\s*to\s*complete", text)
		if match:
			return float(match.group(1))

		match = re.search(r"(\d+\.?\d*)\s*hours?", text)
		if match:
			return float(match.group(1))

		if "questions" in text:
			return np.nan

		return np.nan

	@staticmethod
	def _duration_category(hours):
		if pd.isna(hours):
			return "Unknown"
		if hours < 3:
			return "Short"
		if hours < 15:
			return "Medium"
		return "Long"

	@staticmethod
	def _normalize_level(value):
		if pd.isna(value):
			return "All Levels"

		text = str(value).strip()
		if text == "":
			return "All Levels"

		text_lower = text.lower()

		if "beginner" in text_lower:
			return "Beginner"
		if "intermediate" in text_lower:
			return "Intermediate"
		if "advanced" in text_lower:
			return "Advanced"
		if "all levels" in text_lower:
			return "All Levels"

		return text.title()

	@staticmethod
	def _clean_text_for_metadata(text):
		value = str(text).lower()
		value = re.sub(r"http\S+|www\S+", " ", value)
		value = re.sub(r"\d+", " ", value)
		value = re.sub(r"[^a-z\s]", " ", value)
		value = re.sub(r"\b[a-z]{1,2}\b", " ", value)
		value = re.sub(r"\s+", " ", value).strip()
		return value

	@staticmethod
	def _compute_weighted_score(df: pd.DataFrame) -> pd.Series:
		ratings = df["rating"].fillna(df["rating"].median())
		reviews = df["reviewcount"].fillna(0)

		c_value = ratings.mean()
		m_value = reviews.quantile(0.75)

		if pd.isna(m_value) or m_value == 0:
			m_value = 1.0

		weighted = (
			(reviews / (reviews + m_value)) * ratings
			+
			(m_value / (reviews + m_value)) * c_value
		)

		return weighted

	def run_full_transformation(self, df_udemy: pd.DataFrame, df_coursera: pd.DataFrame) -> pd.DataFrame:
		try:
			logging.info("Starting data transformation")

			udemy = self._normalize_udemy(df_udemy)
			coursera = self._normalize_coursera(df_coursera)

			logging.info("Merging normalized datasets")
			df_courses = pd.concat([udemy, coursera], ignore_index=True)

			df_courses.drop_duplicates(subset="course_title", inplace=True)

			df_courses["reviewcount"] = df_courses["reviewcount"].apply(self._to_float)
			df_courses["rating"] = df_courses["rating"].apply(self._to_float)

			df_courses["reviewcount"] = df_courses["reviewcount"].fillna(0)
			df_courses["rating"] = df_courses["rating"].fillna(df_courses["rating"].median())

			df_courses["duration_hours"] = df_courses["duration"].apply(self._clean_duration)
			df_courses["Duration_Category"] = df_courses["duration_hours"].apply(self._duration_category)

			median_duration = df_courses["duration_hours"].median()
			if pd.isna(median_duration):
				median_duration = 0
			df_courses["duration_hours"] = df_courses["duration_hours"].fillna(median_duration)

			df_courses["skills"] = df_courses["skills"].fillna("")
			df_courses["description"] = df_courses["description"].fillna("")
			df_courses["level"] = df_courses["level"].apply(self._normalize_level)
			df_courses["image"] = df_courses["image"].fillna("No_Image")

			df_courses["course_url"] = df_courses["course_url"].fillna("")
			df_courses["course_url"] = df_courses.apply(
				lambda row: "https://www.udemy.com" + row["course_url"]
				if row["platform"] == "Udemy" and str(row["course_url"]).startswith("/")
				else row["course_url"],
				axis=1,
			)
			df_courses["course_url"] = df_courses["course_url"].astype(str).str.rstrip("/")

			combined_text = (
				df_courses["course_title"].fillna("")
				+ " "
				+ df_courses["description"]
				+ " "
				+ df_courses["skills"]
			)

			df_courses["metadata"] = combined_text.apply(self._clean_text_for_metadata)

			df_courses["weighted_score"] = self._compute_weighted_score(df_courses)

			final_columns = [
				"course_title",
				"rating",
				"reviewcount",
				"level",
				"course_url",
				"image",
				"platform",
				"duration_hours",
				"Duration_Category",
				"metadata",
				"weighted_score",
			]

			final_df = df_courses[final_columns].copy()

			os.makedirs(self.config.processed_data_dir, exist_ok=True)
			final_df.to_csv(self.config.final_data_path, index=False)

			logging.info("Data transformation completed and saved successfully")

			return final_df

		except Exception as e:
			logging.error("Error occurred during data transformation")
			raise CustomException(e, sys)
