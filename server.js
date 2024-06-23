const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { URL } = require('url');
const Sentiment = require('sentiment');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const congratulatoryMessages = [
    "Congratulations!",
    "Great job!",
    "Well done!",
    "Awesome work!",
    "Keep it up!",
    "Fantastic!",
    "Excellent!",
    "Impressive!",
    "Nice work!",
    "Bravo!"
];

const negativeMessages = [
    "Sorry to hear that.",
    "We appreciate your feedback.",
    "Thank you for your input.",
    "We're here to help.",
    "We apologize for any inconvenience."
];

const neutralMessages = [
    "Thank you for your comment.",
    "Thanks for sharing.",
    "We appreciate your feedback.",
    "Thank you for your input.",
    "We value your opinion."
];

const getYoutubeService = (apiKey) => {
    return google.youtube({
        version: 'v3',
        auth: apiKey
    });
};

const fetchComments = async (youtube, videoId) => {
    try {
        const response = await youtube.commentThreads.list({
            part: 'snippet',
            videoId: videoId,
            maxResults: 100,
            textFormat: 'plainText'
        });
        return response.data.items;
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        throw error;
    }
};

const replyToComment = async (youtube, commentId, text) => {
    try {
        const response = await youtube.comments.insert({
            part: 'snippet',
            requestBody: {
                snippet: {
                    parentId: commentId,
                    textOriginal: text
                }
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error replying to comment:', error.message);
        throw error;
    }
};

const getVideoIdFromUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.hostname === 'youtu.be') {
            return parsedUrl.pathname.slice(1);
        } else if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
            return parsedUrl.searchParams.get('v');
        }
        return null;
    } catch (error) {
        console.error('Error parsing URL:', error.message);
        throw error;
    }
};

const analyzeSentiment = (comment) => {
    const sentiment = new Sentiment();
    const result = sentiment.analyze(comment);
    if (result.score > 0) {
        return 'positive';
    } else if (result.score < 0) {
        return 'negative';
    } else {
        return 'neutral';
    }
};

app.post('/run-bot', async (req, res) => {
    const { apiKey, videoUrl } = req.body;
    let videoId;

    try {
        videoId = getVideoIdFromUrl(videoUrl);
    } catch (error) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const youtube = getYoutubeService(apiKey);

    try {
        const comments = await fetchComments(youtube, videoId);
        const results = [];

        for (let comment of comments) {
            const commentId = comment.snippet.topLevelComment.id;
            const commentText = comment.snippet.topLevelComment.snippet.textDisplay;
            const sentiment = analyzeSentiment(commentText);

            let message;
            if (sentiment === 'positive') {
                message = congratulatoryMessages[Math.floor(Math.random() * congratulatoryMessages.length)];
            } else if (sentiment === 'negative') {
                message = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
            } else {
                message = neutralMessages[Math.floor(Math.random() * neutralMessages.length)];
            }

            await replyToComment(youtube, commentId, message);
            results.push({ commentId: commentId, message: message, sentiment: sentiment });
        }

        res.json({ results: results });
    } catch (error) {
        console.error('Error processing comments:', error.message);
        res.status(500).json({ error: 'An error occurred while processing the comments' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
