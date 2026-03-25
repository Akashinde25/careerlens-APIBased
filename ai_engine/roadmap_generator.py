from model_manager import LocalModelManager
import json

class RoadmapGenerator:
    def __init__(self):
        self.llm = LocalModelManager()

    def generate_roadmap(self, gap_items):
        """
        For each Red gap item, generate a structured learning plan.
        gap_items is a list of red gap objects.
        """
        roadmaps = []
        for gap in gap_items:
            skill = gap.get("skill")
            if not skill: continue
            
            prompt = f"""
            Generate a targeted, 3-week learning roadmap for a software engineer to learn: {skill}.
            
            Return ONLY a valid JSON object matching this schema exactly:
            {{
              "skill": "{skill}",
              "why_it_matters": "{gap.get('why_it_matters', 'Required for the role')}",
              "current_level": "none",
              "target_level": "working knowledge",
              "days_to_achieve": 21,
              "daily_hours_assumed": 2,
              "week_1": ["task 1", "task 2", "task 3"],
              "week_2": ["task 1", "task 2"],
              "week_3": ["project idea 1", "task 2"],
              "free_resources": ["url 1", "course 2"],
              "project_idea": "Build a ..."
            }}
            """
            
            try:
                res = self.llm.generate(prompt, response_format="json")
                if res:
                    roadmaps.append(json.loads(res))
            except Exception as e:
                print(f"Failed to generate roadmap for {skill}: {e}")
                roadmaps.append({
                    "skill": skill,
                    "error": "Failed to generate roadmap"
                })
                
        return roadmaps
