'use strict';

var irc = require('irc');
var tutor = require('tutor');

var config = {
    server: 'irc.freenode.org',
    botName: 'Helibot',
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

var sets = {};

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

var pickCards = function ( cardList , n ) {
    n = n || 1;

    var idx;
    var idxs = [ ];
    var cards = [ ];
    var l = cardList.length;

    for ( var i = 0; i < n; i++) {
        idx = Math.floor( Math.random( ) * l-- );

        for ( var j = 0, k = idxs.length; j < k; j++ ) {
            if ( idxs[ j ] <= idx ) { idx++; }
        }

        idxs.push( idx );
        cards.push( cardList[ idx ] );
    }

    return cards;
};

var openBooster = function ( setName ) {
    var cards = sets[ setName ];

    var token  = Math.random( ) < 0.5;
    var foil   = Math.random( ) < 0.7;
    var mythic = Math.random( ) < 0.8;

    say( '!' + pickCards( cards.Land )[ 0 ].name );

    foil && say( 'foil: ' + pickCards( cards.cards )[ 0 ].name );

    say( '!' + pickCards( cards[ mythic ? 'Mythic Rare' : 'Rare' ] )[ 0 ].name );

    var U = pickCards( cards.Uncommon , 3 );
    say( '!' + U[ 0 ].name );
    say( '!' + U[ 1 ].name );
    say( '!' + U[ 2 ].name );

    var C = pickCards( cards.Common , foil ? 9 : 10 )
    say( '!' + C[ 0 ].name );
    say( '!' + C[ 1 ].name );
    say( '!' + C[ 2 ].name );
    say( '!' + C[ 3 ].name );
    say( '!' + C[ 4 ].name );
    say( '!' + C[ 5 ].name );
    say( '!' + C[ 6 ].name );
    say( '!' + C[ 7 ].name );
    say( '!' + C[ 8 ].name );
    !foil && say( '!' + C[ 9 ].name );
};

var setSet = function ( setName , cards ) {
    sets[ setName ] = {
        cards         : cards ,
        'Mythic Rare' : [ ] ,
        Rare          : [ ] ,
        Uncommon      : [ ] ,
        Common        : [ ] ,
        Land          : [ ]
    };

    for ( var i = 0, l = cards.length; i < l; i++ ) {
        sets[ setName ][ cards[ i ].rarity ].push( cards[ i ] );
    }
};

var executeCmd = function (cmd) {
    switch (cmd.major) {
        case 'booster':
            if (!cmd.minor) {
                say('Usage: !booster <set name>');

                break;
            }

            var setName = cmd.minor;

            sets[ setName ] ? openBooster( setName ) : tutor.set( setName , function ( err , cards ) {
                if ( err || cards.length < 2 ) { // somehow this returns cards = [null] lulz
                    say( 'Wrong set name?' );

                    return;
                }

                setSet( setName , cards );

                openBooster( setName );
            });
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
