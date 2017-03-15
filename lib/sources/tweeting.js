/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
"use strict";

const Source = require("./source");

class TweetingSource extends Source {
    constructor(repo, twitterAccount) {
        super(repo, twitterAccount);

        repo.board.on("updated", async () => {
            const [ columns, columnIds ] = await Promise.all([
                repo.board.columns,
                repo.board.columnIds
            ]);
            const cardsToTweet = columns[columnIds.toTweet].cards;
            //TODO Card tweeted gets potentially ran concurrently, which may cause issues
            Promise.all(Array.from(cardsToTweet.values(), (card) => {
                if(card.canTweet) {
                    let p;
                    if(card.content.isRetweet) {
                        p = twitterAccount.retweet(card.content.tweetToRetweet);
                    }
                    else {
                        let replyTo = null;
                        if(card.content.isReply) {
                            replyTo = card.content.replyTo;
                        }
                        p = twitterAccount.tweet(card.content.tweet, replyTo);
                    }
                    return p.then((url) => repo.board.cardTweeted(card, url));
                }
                return Promise.resolve();
            })).catch(console.error);
        });
    }
}
module.exports = TweetingSource;