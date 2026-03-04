import streamlit as st
from src.pipelines.prediction_pipeline import PredictionPipeline


st.set_page_config(
    page_title="Course Recommendation System",
    page_icon="🎓",
    layout="wide"
)

st.title("🎓 AI Course Recommendation System")

st.write(
    "Find the best online courses from **Udemy and Coursera** "
    "based on your learning goals."
)

# ------------------------
# User Inputs
# ------------------------

query = st.text_input(
    "What do you want to learn?",
    placeholder="Example: Machine Learning"
)

level = st.selectbox(
    "Course Level",
    ["Any", "Beginner", "Intermediate", "Advanced", "All Levels"]
)

col1, col2 = st.columns(2)

with col1:
    min_hours = st.number_input(
        "Minimum Duration (hours)",
        min_value=0,
        value=0
    )

with col2:
    max_hours = st.number_input(
        "Maximum Duration (hours)",
        min_value=0,
        value=50
    )

top_k = st.slider(
    "Number of Recommendations",
    1,
    10,
    5
)

# ------------------------
# Run Recommendation
# ------------------------

if st.button("Recommend Courses"):

    if query.strip() == "":
        st.warning("Please enter a learning topic.")
    else:

        pipeline = PredictionPipeline()

        if level == "Any":
            level = None

        results = pipeline.predict(
            query=query,
            level=level,
            min_hours=min_hours,
            max_hours=max_hours,
            top_k=top_k
        )

        st.subheader("Recommended Courses")

        for i, row in results.iterrows():

            st.markdown("---")

            st.markdown(f"### {row['course_title']}")

            col1, col2, col3 = st.columns(3)

            col1.metric("Platform", row["platform"])
            col2.metric("Rating", round(row["rating"], 2))
            col3.metric("Duration (hrs)", round(row["duration_hours"], 1))

            st.write(f"Level: **{row['level']}**")