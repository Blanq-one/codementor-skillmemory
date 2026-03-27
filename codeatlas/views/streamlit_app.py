import requests
import streamlit as st


def main() -> None:
    st.set_page_config(page_title="CodeAtlas", layout="wide")
    st.title("CodeAtlas — Agentic Code Intelligence (MVP)")

    api_base = st.text_input("API Base URL", value="http://localhost:8000")
    api_key = st.text_input("API Key (optional)", type="password")
    st.divider()

    st.subheader("1) Analyze Repository")
    repo_url = st.text_input("GitHub Repo URL")
    if st.button("Analyze Repo"):
        response = _post(
            api_base,
            "/analyze-repo",
            {"repo_url": repo_url},
            api_key=api_key,
            timeout=120,
        )
        response.raise_for_status()
        payload = response.json()
        st.success(f"Indexed repo. ID: {payload['repository_id']}")

    st.subheader("2) Query")
    repo_id = st.text_input("Repository ID")
    question = st.text_area("Ask a question")

    if st.button("Ask"):
        response = _post(
            api_base,
            "/ask",
            {"repo_id": repo_id, "question": question},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.subheader("Answer")
        st.write(payload["answer"])
        st.subheader("Citations")
        st.write(payload["citations"])
        st.subheader("Reasoning Steps")
        st.write(payload["reasoning_steps"])

    st.subheader("3) Search")
    search_query = st.text_input("Search query")
    top_k = st.number_input("Top K", min_value=1, max_value=20, value=5)
    if st.button("Search"):
        response = _post(
            api_base,
            "/search",
            {"repo_id": repo_id, "query": search_query, "top_k": int(top_k)},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.write(payload["results"])

    st.subheader("4) Dependencies")
    direction = st.selectbox("Direction", options=["inbound", "outbound"])
    node_id = st.text_input("Node ID (file path or module)")
    if st.button("Get Dependencies"):
        response = _post(
            api_base,
            "/dependencies",
            {"repo_id": repo_id, "node_id": node_id, "direction": direction},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.write(payload["neighbors"])

    st.subheader("5) List Files")
    if st.button("List Files"):
        response = _post(
            api_base,
            "/files",
            {"repo_id": repo_id},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.write(payload["files"])

    st.subheader("6) Repo Overview")
    if st.button("Get Repo Overview"):
        response = _post(
            api_base,
            "/repo-overview",
            {"repo_id": repo_id},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.write(payload)

    st.subheader("7) Explain Code")
    node_id_explain = st.text_input("Node ID to explain (path or path:start-end)")
    if st.button("Explain"):
        response = _post(
            api_base,
            "/explain",
            {"repo_id": repo_id, "node_id": node_id_explain},
            api_key=api_key,
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        st.write(payload["summary"])
        st.code(payload["snippet"])

    st.subheader("8) List Indexed Repos")
    if st.button("List Repos"):
        response = _get(api_base, "/repos", api_key=api_key, timeout=15)
        response.raise_for_status()
        payload = response.json()
        st.write(payload["repo_ids"])


def _post(api_base: str, path: str, payload: dict, api_key: str, timeout: int):
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key
    return requests.post(
        f"{api_base}{path}",
        json=payload,
        headers=headers,
        timeout=timeout,
    )


def _get(api_base: str, path: str, api_key: str, timeout: int):
    headers = {}
    if api_key:
        headers["X-API-Key"] = api_key
    return requests.get(f"{api_base}{path}", headers=headers, timeout=timeout)


if __name__ == "__main__":
    main()
