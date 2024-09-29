/// <reference lib="webworker" />

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

addEventListener('message', async ({ data }) => {
    const { videoFile, startTime, duration } = data;

    await ffmpeg.load();
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
    await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', startTime,
        '-t', duration,
        'output.mp4'
    ]);

    const outputData = await ffmpeg.readFile('output.mp4');
    postMessage({ outputData });
});