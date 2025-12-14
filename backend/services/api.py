import requests
import json
def researcher_get_vulns(name):
    url = 'https://www.wordfence.com/api/intelligence/v2/vulnerabilities/production'
    response = requests.get(url, headers={"User-Agent": "curl/7.79.1"})
    response.raise_for_status()
    data = response.json()
    result = []
    for vuln in data.values():
        title = vuln.get("title")
        cwe = vuln.get("cwe") or {}
        references = vuln.get("references") or []
        get_url = references[0] if references else None
        researchers = vuln.get("researchers") or []
        plugin = vuln.get("software", [{}])[0]
        slug = plugin.get("slug")
        published = vuln.get("published")
        cve = vuln.get("cve") or {}
        for r in researchers:
            if r == name:
                url2 = f'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]={slug}&request[fields][active_installs]=true'
                try:
                    response2 = requests.get(url2, headers={"User-Agent": "curl/7.79.1"})
                    response2.raise_for_status()
                    data2 = response2.json()
                    active_installs = data2.get("active_installs")
                    result.append({
                        "title" : title,
                        "install" : active_installs,
                        "url" : get_url,
                        "cwe" : cwe,
                        "researchers" : researchers,
                        "published" : published,
                        "cve" : cve,
                    })
                except requests.HTTPError as e:
                    if e.response is not None and e.response.status_code == 404:
                        continue
                    raise
    return result
