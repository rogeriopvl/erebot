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
    {
        channels: config.channels ,
        floodProtection : true ,
        floodProtectionDelay : 2500
    }
);

var say = function (msg, from, to) {
    var dest = to === config.botName ? from : config.channels[0];
    bot.say(dest, msg);
};

var sets = { };
var cards = { };

var parseCommand = function (str, from, to) {
    var cmd = {};
    var parts = str.split(' ');

    cmd.major = parts.shift();
    cmd.minor = parts.join( ' ' );
    cmd.from = from;
    cmd.to = to;

    return cmd.major ? cmd : false;
};

var pickCards = function ( cardList , n ) {
    n = n || 1;

    var idx;
    var idxs = [ ];
    var cardsArr = [ ];
    var l = cardList.length;

    for ( var i = 0; i < n; i++) {
        idx = Math.floor( Math.random( ) * l-- );

        for ( var j = 0, k = idxs.length; j < k; j++ ) {
            if ( idxs[ j ] <= idx ) { idx++; }
        }

        idxs.push( idx );
        idxs.sort(function( _1 , _2 ) { return _2 < _1; });
        cardsArr.push( cardList[ idx ] );
    }

    return cardsArr;
};

var openBooster = function ( setName ) {
    var cardsList = sets[ setName ];

    var token  = Math.random( ) > 0.5;
    var foil   = Math.random( ) > 0.7;
    var mythic = Math.random( ) > 0.8;

    say( '!card ' + pickCards( cardsList.Land )[ 0 ].name );

    foil && say( 'foil:\n!card ' + pickCards( cardsList.cards )[ 0 ].name );

    say( '!card ' + pickCards( cardsList[ mythic ? 'Mythic Rare' : 'Rare' ] )[ 0 ].name );

    var U = pickCards( cardsList.Uncommon , 3 );
    say( '!card ' + U[ 0 ].name );
    say( '!card ' + U[ 1 ].name );
    say( '!card ' + U[ 2 ].name );

    var C = pickCards( cardsList.Common , foil ? 9 : 10 )
    say( '!card ' + C[ 0 ].name );
    say( '!card ' + C[ 1 ].name );
    say( '!card ' + C[ 2 ].name );
    say( '!card ' + C[ 3 ].name );
    say( '!card ' + C[ 4 ].name );
    say( '!card ' + C[ 5 ].name );
    say( '!card ' + C[ 6 ].name );
    say( '!card ' + C[ 7 ].name );
    say( '!card ' + C[ 8 ].name );
    !foil && say( '!card ' + C[ 9 ].name );
};

var cardInfo = function( cardName ) {
    var card = cards[ cardName ];

    say( card.name + '\t\t\t' + ( card.mana_cost || '' ) + '\n' +
         card.types + '\t\t\t' + ( card.rarity ? card.rarity : '' ) + '\n' +
         card.text + '\n' +
         ( card.power ? '\t\t\t' + card.power + '/' + card.toughness + '\n' : '' ) +
         ( card.devotion || '' ) );
};

var setSet = function ( setName , cardsList ) {
    sets[ setName ] = {
        cards         : cardsList ,
        'Mythic Rare' : [ ] ,
        Rare          : [ ] ,
        Uncommon      : [ ] ,
        Common        : [ ] ,
        Land          : [ { name : 'Plains' } , { name : 'Island' } , { name : 'Swamp' } , { name : 'Mountain' } , { name : 'Forest' } ]
    };

    for ( var i = 0, l = cardsList.length; i < l; i++ ) {
        sets[ setName ][ cardsList[ i ].rarity ].push( cardsList[ i ] );

        !cards[ cardsList[ i ].name ] && setCard( cardsList[ i ].name , cardsList[ i ] );
    }
};

var setCard = function( cardName , card ) {
    cards[ cardName ] = card;
};

var executeCmd = function (cmd) {
    switch (cmd.major) {
        case 'booster':
            if (!cmd.minor) {
                say('Usage: !booster <set name>');

                break;
            }

            var setName = cmd.minor;

            sets[ setName ] ? openBooster( setName ) : tutor.set( setName , function ( err , cardsList ) {
                if ( err || cardsList.length < 2 ) { // somehow this returns cardsList = [null] lulz
                    say( 'Wrong set name?' );

                    return;
                }

                setSet( setName , cardsList );

                openBooster( setName );
            });
            break;
        case 'card':
            if (!cmd.minor) {
                say('Usage: !card <card name>');

                break;
            }

            var cardName = cmd.minor;

            cards[ cardName ] ? cardInfo( cardName ) : tutor.card(cmd.minor, function (err, card) {
                if ( err ) {
                    say( 'Card not found!' );

                    return;
                }

                setCard( cardName , card );

                cardInfo( cardName );
            });
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
