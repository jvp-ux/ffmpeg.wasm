/// <reference lib="webworker" />

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

addEventListener('message', async ({ data }) => {
    console.log('Worker: Received message', data);

    switch (data.type) {
        case 'init':
            await initializeFFmpeg(data.config);
            break;
        case 'transcode':
            await transcodeVideo(data);
            break;
    }
});

async function initializeFFmpeg(config: any) {
    try {
        ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress, time }) => {
            console.log(`Worker: Progress ${(progress * 100).toFixed(2)}%, time: ${time}`);
            postMessage({ type: 'progress', progress, time });
        });
        await ffmpeg.load(config);
        console.log('Worker: FFmpeg loaded successfully');
    } catch (error) {
        console.error('Worker: Error initializing FFmpeg', error);
        postMessage({ type: 'error', error: 'Failed to initialize FFmpeg' });
    }
}

async function transcodeVideo({ videoFile, startTime, duration }: any) {
    try {
        if (!ffmpeg) {
            throw new Error('FFmpeg not initialized');
        }

        console.log('Worker: Writing input file');
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
        console.log('Worker: Input file written successfully');

        console.log(`Worker: Executing FFmpeg command with startTime: ${startTime}, duration: ${duration}`);
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-ss', startTime,
            '-t', duration,
            'output.mp4'
        ]);
        console.log('Worker: FFmpeg command executed successfully');

        console.log('Worker: Reading output file');
        const outputData = await ffmpeg.readFile('output.mp4');
        console.log('Worker: Output file read successfully');

        console.log('Worker: Posting message back to main thread');
        postMessage({ type: 'complete', outputData });
    } catch (error: unknown) {
        console.error('Worker: Error occurred', error);
        if (error instanceof Error) {
            postMessage({ type: 'error', error: error.message });
        } else {
            postMessage({ type: 'error', error: 'An unknown error occurred' });
        }
    }
}

console.log('Worker: Initialized and ready');