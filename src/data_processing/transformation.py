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

    def generate_course_ids(self, df_udemy, df_coursera):
        try:
            logging.info("Generating unique Course IDs")

            df_udemy['Course_Id'] = [f'u{i:05d}' for i in range(1, len(df_udemy) + 1)]
            df_coursera['Course_Id'] = [f'c{i:04d}' for i in range(1, len(df_coursera) + 1)]

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def drop_columns(self, df_udemy, df_coursera):
        try:
            logging.info("Dropping irrelevant columns")

            df_udemy.drop(['instructor', 'lectures'], axis=1, inplace=True)
            df_coursera.drop(['partner', 'certificatetype', 'crediteligibility'], axis=1, inplace=True)

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def process_coursera_description(self, df_coursera):
        try:
            logging.info("Processing Coursera description")

            df_coursera['description'] = (
                df_coursera['course'].fillna('') + " " +
                df_coursera['skills'].fillna('')
            )

            df_coursera.drop(['skills'], axis=1, inplace=True)

            return df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def rename_columns(self, df_udemy, df_coursera):
        try:
            logging.info("Renaming title columns")

            df_udemy.rename(columns={'title': 'course_title'}, inplace=True)
            df_coursera.rename(columns={'course': 'course_title'}, inplace=True)

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def standardize_levels(self, df_udemy, df_coursera):
        try:
            logging.info("Standardizing level columns")

            df_udemy['level'] = df_udemy['level'].replace({'Expert': 'Advanced'})

            df_coursera['level'] = df_coursera['level'].replace({
                'Mixed ': 'All Levels',
                'Intermediate ': 'Intermediate',
                'Advanced ': 'Advanced',
                'Beginner ': 'Beginner',
                'Specialization': 'Advanced',
                'Degree': 'Advanced',
                'Course': 'Beginner'
            })

            df_coursera['level'] = df_coursera['level'].fillna('Beginner')
            df_udemy['level'] = df_udemy['level'].fillna('All Levels')

            return df_udemy, df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def clean_udemy_duration(self, df_udemy):
        try:
            logging.info("Cleaning Udemy duration")

            df_udemy = df_udemy[~df_udemy['duration'].str.contains('questions', case=False, na=False)]
            df_udemy = df_udemy[~df_udemy['duration'].str.contains('All Levels', case=False, na=False)]

            df_udemy[['duration_val','duration_unit']] = \
            df_udemy['duration'].str.extract(r'(\d+\.?\d*)\s*([a-zA-Z]+)')

            df_udemy['duration_val'] = df_udemy['duration_val'].astype(float)

            df_udemy.loc[df_udemy['duration_unit'] == 'total mins', 'duration_val'] /= 60

            df_udemy.rename(columns={'duration_val': 'duration_hours'}, inplace=True)

            df_udemy.drop(['duration_unit', 'duration'], axis=1, inplace=True)

            return df_udemy

        except Exception as e:
            raise CustomException(e, sys)

    def convert_k_to_num(self, val):
        if pd.isna(val):
            return 0
        val = str(val).lower().strip()
        if 'k' in val:
            return float(val.replace('k', '')) * 1000
        return float(val)

    def clean_coursera_reviews(self, df_coursera):
        try:
            logging.info("Cleaning Coursera reviews")

            df_coursera['reviewcount'] = df_coursera['reviewcount'].apply(self.convert_k_to_num)
            df_coursera['rating'] = df_coursera['rating'].fillna(0)

            return df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def standardize_to_months(self, text):
        if pd.isna(text):
            return np.nan

        text = str(text).lower()
        text = text.replace('meses', 'months').replace('mes', 'month').replace('a', '-')

        nums = [float(n) for n in re.findall(r"[-+]?\d*\.\d+|\d+", text)]
        if not nums:
            return np.nan

        val = sum(nums) / len(nums)

        if 'year' in text:
            return val * 12
        elif 'week' in text:
            return val / 4.33
        elif 'hour' in text:
            return val / 40
        else:
            return val

    def clean_coursera_duration(self, df_coursera):
        try:
            logging.info("Cleaning Coursera duration")

            df_coursera['duration_months'] = df_coursera['duration'].apply(self.standardize_to_months)
            df_coursera['duration_hours'] = df_coursera['duration_months'] * 60

            df_coursera.drop(['duration', 'duration_months'], axis=1, inplace=True)

            df_coursera['duration_hours'] = df_coursera['duration_hours'].fillna(0)
            df_coursera['description'] = df_coursera['description'].fillna(df_coursera['course_title'])

            return df_coursera

        except Exception as e:
            raise CustomException(e, sys)

    def merge_datasets(self, df_udemy, df_coursera):
        try:
            logging.info("Merging datasets")

            df_master = pd.concat([df_coursera, df_udemy], ignore_index=True)

            df_master['platform'] = np.where(
                df_master['Course_Id'].str.startswith('c'),
                'Coursera',
                'Udemy'
            )

            df_master['Course_Id'] = range(1, len(df_master) + 1)

            df_master = df_master.sample(frac=1, random_state=42).reset_index(drop=True)

            return df_master

        except Exception as e:
            raise CustomException(e, sys)

    def balance_metadata(self, row):

        title = str(row["course_title"])
        desc = str(row["description"])

        if row["platform"] == "Coursera":
            return title + " " + desc
        else:
            return title + " " + title + " " + desc


    def clean_for_nlp(self, text):
        if pd.isna(text):
            return ""

        text = str(text).lower()
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()

        return text

    def compute_weighted_score(self, df):

        logging.info("Computing weighted score")

        C = df["rating"].mean()

        m = df["reviewcount"].quantile(0.75)

        df["reviewcount"] = df["reviewcount"].fillna(0)
        df["rating"] = df["rating"].fillna(0)

        def weighted(row):

            v = row["reviewcount"]
            R = row["rating"]

            if v + m == 0:
                return 0

            return (v/(v+m) * R) + (m/(v+m) * C)

        df["weighted_score"] = df.apply(weighted, axis=1)

        return df

    def run_full_transformation(self, df_udemy, df_coursera):
        try:

            logging.info("Starting full data transformation")

            df_udemy, df_coursera = self.generate_course_ids(df_udemy, df_coursera)
            df_udemy, df_coursera = self.drop_columns(df_udemy, df_coursera)
            df_coursera = self.process_coursera_description(df_coursera)
            df_udemy, df_coursera = self.rename_columns(df_udemy, df_coursera)
            df_udemy, df_coursera = self.standardize_levels(df_udemy, df_coursera)

            df_udemy = self.clean_udemy_duration(df_udemy)
            df_coursera = self.clean_coursera_duration(df_coursera)
            df_coursera = self.clean_coursera_reviews(df_coursera)

            df = self.merge_datasets(df_udemy, df_coursera)

            logging.info("Creating metadata")

            df["metadata_balanced"] = df.apply(self.balance_metadata, axis=1)
            df["metadata"] = df["metadata_balanced"].apply(self.clean_for_nlp)

            df.drop(["metadata_balanced" , "description"], axis=1, inplace=True)

            logging.info("Adding weighted score")

            df = self.compute_weighted_score(df)

            os.makedirs(self.config.processed_data_dir, exist_ok=True)

            df.to_csv(self.config.final_data_path, index=False)

            logging.info("Processed dataset saved successfully")

            return df

        except Exception as e:
            raise CustomException(e, sys)