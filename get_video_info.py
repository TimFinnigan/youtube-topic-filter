import requests
import os

def get_video_info(api_key, video_id):
    base_url = 'https://www.googleapis.com/youtube/v3/videos'
    params = {
        'part': 'snippet',
        'id': video_id,
        'key': api_key
    }
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        data = response.json()
        video_info = {
            'title': data['items'][0]['snippet']['title'],
            'channel': data['items'][0]['snippet']['channelTitle']
        }
        return video_info
    else:
        return None
