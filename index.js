'use strict';

var config = require('./config.json');
var irc = require('irc');
var tutor = require('tutor');


var bot = new irc.Client(
    config.server ,
    config.botName ,
    {
        channels             : config.channels ,
        floodProtection      : true ,
        floodProtectionDelay : 1000
    }
);

var repeatStr = function( str , n ) { return new Array( n + 1 ).join( str ); };

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
        cardsArr.push( cardList[ idx ].name );
    }

    return cardsArr;
};

var openBooster = function ( cmd ) {
    var cardsList = sets[ cmd.minor ];

    var token  = Math.random( ) > 0.5;
    var foil   = Math.random( ) > 0.7;
    var mythic = Math.random( ) > 0.8;

    foil && say( 'foil:\n!card ' + pickCards( cardsList.cards )[ 0 ] , cmd.from, cmd.to );

    say( '!card ' + pickCards( cardsList[ mythic ? 'Mythic Rare' : 'Rare' ] )[ 0 ] , cmd.from, cmd.to );

    say( '!card ' + pickCards( cardsList.Uncommon , 3 ).join( '\n!card ' ) , cmd.from, cmd.to );
    say( '!card ' + pickCards( cardsList.Common , foil ? 9 : 10 ).join( '\n!card ' ) , cmd.from, cmd.to );
};

var setInfo = function( cmd ) {
    var setName = cmd.minor;
    var cardsList = sets[ setName ];

    var total    = cardsList.cards.length;
    var mythic   = cardsList[ 'Mythic Rare' ].length;
    var probM    = ( 1 / 8 + mythic / 7 / total ) * 100;
    var probMr   = probM / mythic;
    var rare     = cardsList.Rare.length;
    var probR    = ( 7 / 8 + rare / 7 / total ) * 100;
    var probRr   = probR / rare;
    var uncommon = cardsList.Uncommon.length;
    var probU    = ( 3 + uncommon / 7 / total ) * 100;
    var probUr   = probU / uncommon;
    var common   = cardsList.Common.length;
    var probC    = ( ( 9 * 6 + 8 ) / 7 + common / 7 / total ) * 100;
    var probCr   = probC / common;

    say( setName + ' numbers:\n' +
         '\tTotal cards:\t\t\t' + total + '\n' +
         '\tMythic cards:\t\t\t' + mythic + '\n' +
         '\tRare cards:\t\t\t' + rare + '\n' +
         '\tUncommon cards:\t' + uncommon + '\n' +
         '\tCommon cards:\t\t' + common , cmd.from, cmd.to );

    say( 'Probability when opening a booster:\n' +
         '\tMythic card:\t\t' + probM.toFixed( 1 ) + '% (' + probMr.toFixed( 1 ) + '%)\n' +
         '\tRare card:\t\t\t' + probR.toFixed( 1 ) + '% (' + probRr.toFixed( 1 ) + '%)\n' +
         '\tUncommon card:\t' + probU.toFixed( 1 ) + '% (' + probUr.toFixed( 1 ) + '%)\n' +
         '\tCommon card:\t' + probC.toFixed( 1 ) + '% (' + probCr.toFixed( 1 ) + '%)' , cmd.from, cmd.to );

    say( 'Probability when opening a booster box:\n' +
         '\tMythic card:\t\t' + ( probM * 36 ).toFixed( 1 ) + '% (' + ( probMr * 36 ).toFixed( 1 ) + '%)\n' +
         '\tRare card:\t\t\t' + ( probR * 36 ).toFixed( 1 ) + '% (' + ( probRr * 36 ).toFixed( 1 ) + '%)\n' +
         '\tUncommon card:\t' + ( probU * 36 ).toFixed( 1 ) + '% (' + ( probUr * 36 ).toFixed( 1 ) + '%)\n' +
         '\tCommon card:\t' + ( probC * 36 ).toFixed( 1 ) + '% (' + ( probCr * 36 ).toFixed( 1 ) + '%)' , cmd.from, cmd.to );
};

var cardInfo = function( cmd ) {
    var card = cards[ cmd.minor ];

    var nLen = card.name.length;
    var type = card.types + ( card.subtypes.length ? ' - ' + card.subtypes : '' );
    var tLen = type.length;
    var mLen = Math.max( nLen , tLen , 20 );
    var mTab = repeatStr( '\t' , Math.floor( mLen / 4 ) + 3 );

    say( card.name + repeatStr( '\t' , Math.floor( ( mLen - nLen ) / 4 ) + 3 ) + ( card.mana_cost || '' ) + '\n' +
         type + repeatStr( '\t' , Math.floor( ( mLen - tLen ) / 4 ) + 3 ) + ( card.rarity ? card.rarity : '' ) + '\n' +
         ( card.text ? card.text + '\n' : '' ) +
         ( card.power ? mTab + card.power + '/' + card.toughness + '\n' : '' ) +
         ( card.loyalty ? mTab + card.loyalty : '' ) , cmd.from, cmd.to );
};

var setSet = function ( setName , cardsList ) {
    sets[ setName ] = {
        cards         : cardsList ,
        'Mythic Rare' : [ ] ,
        Rare          : [ ] ,
        Uncommon      : [ ] ,
        Common        : [ ] ,
        Land          : [ ]
    };

    for ( var i = 0, l = cardsList.length; i < l; i++ ) {
        var card = cardsList[ i ];

        sets[ setName ][ card.rarity ].push( card );

        ( !cards[ card.name ] || !cards[ card.name ].rarity ) && setCard( card.name , card );
    }

    delete sets[ setName ].Land;
};

var setCard = function( cardName , card ) {
    cards[ cardName ] = card;
};

var tutorSetBypass = function( cmd , cb ) {
    var setName = cmd.minor;

    sets[ setName ] ? cb( cmd ) : tutor.set( setName , function ( err , cardsList ) {
        if ( err || cardsList.length < 2 ) { // somehow this returns cardsList = [null] lulz
            say( 'Wrong set name?' );

            return;
        }

        setSet( setName , cardsList );

        cb( cmd );
    });
};

var executeCmd = function (cmd) {
    switch (cmd.major) {
        case 'help':
            say( 'Command list:\n' +
                 '\t!booster <set name>\n' +
                 '\t!card <card name>\n' +
                 '\t!set <set name>\n' +
                 '\t!FNM <tornament type> (not implemented yet)' );

            break;
        case 'FNM':
            if (!cmd.minor) {
                say('Usage: !FNM <Draft|Sealed>');

                break;
            }

            say( 'Not implemented yet!' );
            break;
        case 'booster':
            if (!cmd.minor) {
                say('Usage: !booster <set name>');

                break;
            }

            tutorSetBypass( cmd , openBooster );
            break;
        case 'set':
            if (!cmd.minor) {
                say('Usage: !set <set name>');

                break;
            }

            tutorSetBypass( cmd , setInfo );
            break;
        case 'card':
            if (!cmd.minor) {
                say('Usage: !card <card name>');

                break;
            }

            var cardName = cmd.minor;

            cards[ cardName ] ? cardInfo( cmd ) : tutor.card(cmd.minor, function (err, card) {
                if ( err ) {
                    say( 'Card not found!' );

                    return;
                }

                setCard( cardName , card );

                cardInfo( cmd );
            });
            break;
    }
};

bot.addListener('join', function (channel, who) {
    if (who === config.botName) {
        bot.say(channel, 'Greetings! I\'m a bot at your service.');
    } else {
        bot.say( channel , 'Welcome ' + who + '!' );
        bot.say( who , 'You now can talk to me in private!\nTo see commands, do:\n\t!help' );
    }
});

bot.addListener('message', function (from, to, message) {
    if ( message.charAt( 0 ) === '!' && message.length > 1 ) {
        var cmd = parseCommand( message.substring( 1 ) );

        if ( cmd ) {
            cmd.from = from;
            cmd.to   = to;

            executeCmd( cmd );
        } else {
            say( 'Command unkown or incorrect.' );
        }
    }
});
