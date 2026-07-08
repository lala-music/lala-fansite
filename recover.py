
import json
with open(r"C:\Users\user\.gemini\antigravity\brain\aa74c733-6203-4a0c-a21b-2ab25176ab89\.system_generated\logs\transcript.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if "content" in data and "Calendar Event Management" in data["content"] and "<form id=\"adminEventForm\"" in data["content"]:
            print("FOUND IT!")
            with open("recovered.html", "w", encoding="utf-8") as out:
                out.write(data["content"])
            break

