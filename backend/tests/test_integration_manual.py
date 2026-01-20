import httpx
import time
import json

BASE_URL = "http://localhost:8000/api"

def run_test():
    print("starting integration test...")
    
    # 1. Generate text with watermark
    print("\n[1] Testing Generation (Watermark ON)...")
    payload = {
        "input_text": "Write a very short poem about coding.",
        "model": "google/gemma-2b-it", 
        "watermark_enabled": True,
        "max_tokens": 50,
        "temperature": 0.7
    }
    
    try:
        with httpx.Client(timeout=120.0) as client: # Generative AI can be slow
            response = client.post(f"{BASE_URL}/generations", json=payload)
            
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                print(response.text)
                return

            gen_data = response.json()
            generation_id = gen_data["generation_id"]
            print(f"Success! ID: {generation_id}")
            print(f"Output: {gen_data['output_text']}")

            # 2. Run Detection
            print(f"\n[2] Testing Detection for ID {generation_id}...")
            # Note: The backend endpoint is POST /generations/{id}/detections
            det_response = client.post(f"{BASE_URL}/generations/{generation_id}/detections", json={})
            
            if det_response.status_code != 200:
                print(f"Error: {det_response.status_code}")
                print(det_response.text)
                return

            det_data = det_response.json()
            print("Detection Result:")
            print(json.dumps(det_data, indent=2))
            
            if det_data.get("is_watermarked"):
                print("\n[PASS] Watermark successfully detected!")
            else:
                print("\n[WARN] Watermark NOT detected (this might happen with very short text or weak watermark settings).")

    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}.")
    except Exception as exc:
        print(f"An unexpected error occurred: {exc}")

if __name__ == "__main__":
    run_test()
