# 代码说明:

# 导入库: 导入了 Flask、render_template、request、jsonify 用于 Flask 应用；os 用于文件路径操作；cv2 用于可能的视频处理。

# 创建 Flask 实例: 初始化 Flask 应用。

# 配置上传文件夹: 设置一个变量 UPLOAD_FOLDER 来存储上传的视频文件。确保这个文件夹存在于您的文件系统中。

# 根目录路由: 定义一个路由 / 来渲染主页。

# 上传路由: 定义一个路由 /upload 用于处理视频文件的上传。它检查请求中是否包含视频文件，如果包含则保存到指定的上传文件夹。

# 启动应用: 如果直接运行此脚本，则启动 Flask 应用。

# 注意事项:

# 确保上传目录 E:/Python_documents/Chatgpt_UI/Videos 在您的系统中实际存在，否则上传会失败。
# 这段代码未包含安全性检查，例如验证上传的文件类型。在生产环境中，这是非常重要的。
# app.run(debug=True) 开启了调试模式，这对于开发是有用的，但在生产环境中应当关闭。

# 导入 Flask 和其他必要的库
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS  # 导入 Flask-CORS
import os
import cv2  # 使用 OpenCV 处理视频
import base64

# Chatgpt 所需库
from IPython.display import display, Image, Audio
import cv2  
import base64
import time
from openai import OpenAI
import os
import requests

# Edge TTS 所需的库
import asyncio
import edge_tts

# 引入time模块作为文件名
import time


# 获取访问权限
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 创建一个 Flask 应用实例,规定网站的静态入口文件夹
app = Flask(__name__)

# 使用 Flask-CORS
CORS(app)  # 初始化 CORS。这将允许所有域名下的所有路由的跨域请求。

# 设置上传文件夹的路径
UPLOAD_SOURCE_FOLDER='upload'
UPLOAD_FOLDER = 'MP3'  # 指定mp3文件的路径，确保这个路径已经存在
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_SOURCE_FOLDER'] = UPLOAD_SOURCE_FOLDER

def save_uploaded_file():
    #函数描述：
    #"保存上传的视频文件"
    #如果上传成功，则返回文件路径，否则返回 None"""
    print("正在保存上传的视频文件")
    # 检查请求中是否有文件部分
    if 'video' in request.files:
        video_file = request.files['video']
        # 检查文件名是否不为空
        if video_file.filename != '':
            
            # 构建文件的保存路径
            filepath = os.path.join(app.config['UPLOAD_SOURCE_FOLDER'], video_file.filename)
            # 保存文件
            video_file.save(filepath)
            print("源文件保存成功，并返回文件路径")
            return filepath
        return None   

def extract_video_frames(filepath):
        #函数描述：
        #功能：使用 OpenCV 从自然视频中提取帧：
        #参数：目标视频的路径
        #如果上传成功，则返回提取的帧，否则提前结束
        print("开始从自然视频中提取帧")
        video = cv2.VideoCapture(filepath)
        base64Frames = []
        while video.isOpened():
            success, frame = video.read()
            if not success:
                break
            _, buffer = cv2.imencode(".jpg", frame)
            base64Frames.append(base64.b64encode(buffer).decode("utf-8"))

        video.release()
        print(len(base64Frames), "frames 被读取")
        return base64Frames


def generate_video_description(base64Frames):
        #函数描述：
        #功能：制作视频描述
        #参数：视频提取的帧
        #如果成功，则返回生成的描述，否则返回 None
        print("开始制作视频描述")
        PROMPT_MESSAGES = [
            {
                "role": "user",
                "content": [
                     "These are the frames from the video I'm going to upload. Generate a compelling description that I can upload with the video in Chinese.Note: You only need to output the description in Chinese.",
                *map(lambda x: {"image": x, "resize": 428}, base64Frames[0::50]),
                    ],
                },
            ]
        params = {
                "model": "gpt-4-vision-preview",
                "messages": PROMPT_MESSAGES,
                "max_tokens": 400,
            }
            
        result = client.chat.completions.create(**params)
        print("以下为生成的中文描述：",result.choices[0].message.content)
        return result.choices[0].message.content

def generate_narration_script(base64Frames):
        #函数描述：
        #提示 GPT 给我们一个简短的脚本
        #如果成功，则返回生成的描述，否则返回 None
        print("开始制作画外音")
        PROMPT_MESSAGES = [
            {
                "role": "user",
                "content": [
                    "These are frames from a video. Create a short voiceover script in the style of David Attenborough in Chinese. Include only the narration.",
                    *map(lambda x: {"image": x, "resize": 428}, base64Frames[0::60]),
                    ],
                },
            ]
        params = {
                "model": "gpt-4-vision-preview",
                "messages": PROMPT_MESSAGES,
                "max_tokens": 500,
            }

        result = client.chat.completions.create(**params)
        print("以下为视频的中文脚本：",result.choices[0].message.content)
        return result.choices[0].message.content

async def convert_text_to_speech(text, voice, output_file):
    """异步地将文本转换为语音
    使用 edge_tts 库将指定文本转换为语音并保存为文件"""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

async def handle_async_operations(narration_script, output_file):
    await convert_text_to_speech(narration_script, "zh-TW-HsiaoYuNeural", output_file)



# 定义路由：当用户访问网站根目录时，返回 index.html 页面
@app.route('/')
def index():
    # 使用 render_template 来渲染 HTML 页面
    return render_template('index.html')

# 定义文件上传的路由
@app.route('/upload', methods=['POST'])
def upload_file():
    filepath=save_uploaded_file()
    if filepath:
        # 提取视频帧并生成旁白脚本
        frames = extract_video_frames(filepath)
        narration_script = generate_narration_script(frames)
        
        asyncio.run(handle_async_operations(narration_script, os.path.join(UPLOAD_FOLDER, time.strftime("%m-%d %H:%M:%S",time.localtime())+".mp3")))
        # 返回成功信息
        return jsonify({"message": "文件上传成功，保存在 " + os.path.join(UPLOAD_FOLDER, time.strftime("%m-%d %H:%M:%S",time.localtime())+".mp3")})
    # 如果没有文件，返回错误信息
    return jsonify({"message": "没有上传的文件"})

# 当运行这个脚本时，启动 Flask 应用
if __name__ == '__main__':
    app.run(debug=True)

