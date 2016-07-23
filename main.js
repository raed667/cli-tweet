var OAuth = require('oauth').OAuth,
    colors = require('colors'),
    Twitter = require('twitter'),
    fs = require('fs'),
    get_args = require('cli-pipe');

var CONFIG_FILE = 'tweet.json',
    REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token',
    ACCESS_TOKEN_URL = 'https://api.twitter.com/oauth/access_token',
    OAUTH_VERSION = '1.0', HASH_VERSION = 'HMAC-SHA1';

var key = "TtEmoPUPTozWyMUvPJael3U1R", // Tokens from the application "RaedLab" feel free to use them if you don't want to create a Twitter app
    secret = "q9cuovWtbz7Zu2L9wVuBzFTZizg3wN9JoEMtciCImCgIAT9y6K", tweetText;

function getAccessToken(oa, oauth_token, oauth_token_secret, pin) {
    oa.getOAuthAccessToken(oauth_token, oauth_token_secret, pin,
        function (error, oauth_access_token, oauth_access_token_secret, results2) {
            if (error && parseInt(error.statusCode) == 401) {
                throw new Error('The pin number you have entered is incorrect'.bold.red);
            }
            var keys = {
                'ACCESS_TOKEN_KEY': oauth_access_token,
                'ACCESS_TOKEN_SECRET': oauth_access_token_secret
            };
            fs.open(CONFIG_FILE, "wx", function (err, fd) {
                try {
                    fs.close(fd, function (err) {
                    });
                } catch (e) {
                }
            });
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(keys));
            console.log('Try echo "test" | cli-tweet'.cyan);
            process.exit(1);
        });
}

function getRequestToken(oa) {
    oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
        if (error) {
            throw new Error(([error.statusCode, error.data].join(': ')).bold.red);
        } else {
            console.log(('https://twitter.com/oauth/authorize?oauth_token=' + oauth_token).underline.blue)
            console.log('Enter the pin number here:'.bold.yellow);
            var stdin = process.openStdin();
            stdin.on('data', function (chunk) {
                var pin = chunk.toString().trim();
                getAccessToken(oa, oauth_token, oauth_token_secret, pin);
            });
        }
    });
}

function tweet(userTokens) {
    var client = new Twitter({
        consumer_key: key,
        consumer_secret: secret,
        access_token_key: userTokens.oauth_access_token,
        access_token_secret: userTokens.oauth_access_token_secret
    });
    console.log("Tweet :" + tweetText.bold.cyan);
    if (tweetText.length > 0) {
        client.post('statuses/update', {status: tweetText}, function (error, tweet, response) {
            if (error) {
                console.log("Error :" + JSON.stringify(error));
            }
            process.exit(1);
        });
    } else {
        console.log("Pipe a tweet".bold.red);
    }
}

var isConfig = process.argv[2];
if (isConfig === undefined || isConfig.toLowerCase() != "config") {
    try {
        var contents = fs.readFileSync(CONFIG_FILE).toString(), tokens = JSON.parse(contents);
    } catch (e) {
        console.log("Error: Try running 'tweet config' command".bold.red);
    }
    if (tokens != undefined && (tokens.ACCESS_TOKEN_KEY != undefined && tokens.ACCESS_TOKEN_SECRET != undefined)) {
        try {
            get_args(function (args) {
                tweetText = args[2];
                tweet({
                    "oauth_access_token": tokens.ACCESS_TOKEN_KEY,
                    "oauth_access_token_secret": tokens.ACCESS_TOKEN_SECRET
                });
            });
        } catch (e) {
            console.log("Error: Unexpected error while tweeting".bold.red);
        }
    } else {
        console.log("Try running 'cli-tweet config' command".bold.red);
    }
} else {
    var oa = new OAuth(REQUEST_TOKEN_URL, ACCESS_TOKEN_URL, key, secret, OAUTH_VERSION, 'oob', HASH_VERSION);
    getRequestToken(oa);
}