'use strict';

var irc = require('irc');
var tutor = require('tutor');

var config = {
    server: 'irc.freenode.org',
    botName: 'Erebot',
    channels: [ '#mtgsapo' ]
};

var bot = new irc.Client(
    config.server,
    config.botName,
    { channels: config.channels }
);

var say = function (msg, from, to) {
    var dest = to === config.botName ? from : config.channels[0];
    bot.say(dest, msg);
};

var getBooster = function (setName) {
    say('Not implemented yet.');
    return;
    tutor.set(setName, function (err, cards) {
        if (err || cards.length < 2) { // somehow this returns cards = [null] lulz
            say('Wrong set name?');
            return;
        }
        // TODO
    });
};

var parseCommand = function (str, from, to) {
    var cmd = {};
    var parts = str.split(' ');

    cmd.major = parts.shift();
    cmd.minor = parts.shift();
    cmd.arg = parts.shift();
    cmd.from = from;
    cmd.to = to;

    return cmd.major ? cmd : false;
};

var executeCmd = function (cmd) {
    switch (cmd.major) {
        case 'card':
            tutor.card(cmd.minor, function (err, card) {
                if (err) {
                    say('Card not found!');
                    console.log(err);
                } else {
                    say(card.name);
                    say(card.mana_cost);
                    say(card.text);
                    if (card.power !== undefined) {
                        say(card.power + '/' + card.toughness);
                    }
                    say(card.devotion);
                }
            });
            break;
        case 'booster':
            if (!cmd.minor) {
                say('Usage: !booster <set name>');
            } else {
                getBooster(cmd.minor);
            }
            break;
        default:
            say('Unknown command.');
            break;
    }
};

bot.addListener('join', function (channel, who) {
    if (who === config.botName) {
        bot.say(channel, 'Greetings! I\'m a bot at your service.');
    } else {
        bot.say(channel, 'Welcome ' + who + ' !');
    }
});

bot.addListener('message', function (from, to, message) {

    if (message.charAt(0) === '!' && message.length > 1) {
        var cmd = parseCommand(message.substring(1));

        if (cmd) {
            executeCmd(cmd);
        } else {
            say('Command unkown or incorrect.');
        }
    }
});
