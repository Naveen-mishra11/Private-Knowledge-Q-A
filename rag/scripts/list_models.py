import os

from dotenv import load_dotenv

load_dotenv(override=True)

import google.generativeai as genai


def main() -> None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Missing GEMINI_API_KEY")

    genai.configure(api_key=api_key)

    models = list(genai.list_models())
    print(f"Total models: {len(models)}")

    # Print only models that support generateContent.
    usable = []
    for m in models:
        methods = getattr(m, "supported_generation_methods", [])
        if "generateContent" in methods:
            usable.append(m)

    print(f"Models supporting generateContent: {len(usable)}")
    for m in usable:
        methods = ",".join(getattr(m, "supported_generation_methods", []))
        print(f"{m.name} | {methods}")


if __name__ == "__main__":
    main()
