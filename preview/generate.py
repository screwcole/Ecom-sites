"""
Method/N — Higgsfield image generator.

Usage:
    python preview/generate.py            # list presets
    python preview/generate.py hero       # generate one preset
    python preview/generate.py all        # generate every preset

Reads credentials from ../.env (HIGGSFIELD_API_KEY, HIGGSFIELD_API_SECRET).
Saves results to ../assets/generated/.  First run prints the raw API response
so the request/poll shape can be confirmed against the live account.
"""
import os, sys, json, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Work in preview/generated (Shopify assets/ must stay flat — finals get copied in later).
OUT = os.path.join(ROOT, "preview", "generated")
os.makedirs(OUT, exist_ok=True)


def load_env():
    env = {}
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


ENV = load_env()
KEY = ENV.get("HIGGSFIELD_API_KEY", "")
SECRET = ENV.get("HIGGSFIELD_API_SECRET", "")
BASE = ENV.get("HIGGSFIELD_BASE", "https://platform.higgsfield.ai").rstrip("/")
HEADERS = {
    "Authorization": "Key {}:{}".format(KEY, SECRET),
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# Brand-consistent prompts: white box, GREEN circle, "Method/N", clean studio.
STYLE = ("Method/N NAD+ Patches supplement box, matte white carton with a vivid "
         "emerald-green circle on the front, small 'Method/N' wordmark in black with a "
         "green slash, label text 'NAD+ Patches — Age Defense & Cellular Renewal', "
         "premium minimalist wellness branding, soft studio lighting, crisp focus, "
         "high detail, photorealistic product photography, 8k")

PRESETS = {
    "hero":   STYLE + ", single box standing, soft beige seamless background, gentle shadow",
    "bundle": STYLE + ", three identical boxes arranged in a row, soft green gradient background",
    "skin":   ("Close-up of a small clear transdermal patch on a person's inner forearm, "
               "natural skin, soft daylight, Method/N green branding subtly visible, "
               "clean lifestyle photography, shallow depth of field, photorealistic, 8k"),
    "ugc":    ("Candid lifestyle photo of a happy 35-year-old woman holding a Method/N NAD+ "
               "Patches white box with a green circle, bright airy home, natural light, "
               "authentic UGC selfie style, photorealistic, high detail"),
    "flatlay": ("Top-down flat lay of the Method/N NAD+ Patches white-and-green box with a few "
                "patches, eucalyptus sprigs and soft props on a cream surface, editorial wellness "
                "styling, soft shadows, photorealistic, 8k"),
}


def api(method, path, body=None):
    url = path if path.startswith("http") else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read().decode()
            try:
                return r.status, json.loads(raw)
            except json.JSONDecodeError:
                return r.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def download(u, name):
    dest = os.path.join(OUT, name)
    urllib.request.urlretrieve(u, dest)
    print("  saved ->", dest)
    return dest


def find_url(obj):
    """Walk the JSON looking for the first image URL."""
    if isinstance(obj, str) and obj.startswith("http") and any(obj.lower().endswith(e) for e in (".jpg", ".jpeg", ".png", ".webp")):
        return obj
    if isinstance(obj, dict):
        for v in obj.values():
            u = find_url(v)
            if u:
                return u
    if isinstance(obj, list):
        for v in obj:
            u = find_url(v)
            if u:
                return u
    return None


def generate(name):
    prompt = PRESETS[name]
    print("\n=== {} ===".format(name))
    # Soul is Higgsfield's image model; body shape confirmed on first live run.
    body = {"params": {"prompt": prompt, "aspect_ratio": "1:1", "quality": "1080p"}}
    status, res = api("POST", "/higgsfield-ai/soul/standard", body)
    print("POST status:", status)
    print(json.dumps(res, indent=2)[:1200] if isinstance(res, (dict, list)) else str(res)[:1200])

    # Try to extract a job id and poll, else grab a direct URL.
    job_id = None
    if isinstance(res, dict):
        job_id = res.get("id") or res.get("job_set_id") or (res.get("job_set") or {}).get("id")
    url = find_url(res)
    for _ in range(40):
        if url:
            break
        if not job_id:
            break
        time.sleep(3)
        st, jr = api("GET", "/v1/job-sets/{}".format(job_id))
        url = find_url(jr)
        if url:
            res = jr
            break
    if url:
        download(url, "methodn-{}.jpg".format(name))
    else:
        print("  (no image URL yet — share this output and I'll adjust the request/poll shape)")


if __name__ == "__main__":
    if not KEY or not SECRET:
        sys.exit("Missing credentials. Add HIGGSFIELD_API_KEY and HIGGSFIELD_API_SECRET to .env")
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg == "all":
        for n in PRESETS:
            generate(n)
    elif arg in PRESETS:
        generate(arg)
    else:
        print("Presets:", ", ".join(PRESETS))
        print("Run: python preview/generate.py <preset|all>")
