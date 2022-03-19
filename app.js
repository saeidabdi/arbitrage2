const fs = require('fs');
const axios = require('axios');

var counter = 0;
var counter1 = 0, Sm = 0;

console.log(('start arbitrage app nobitex!'));



const main = async () => {

    var [BTCnobitex, BTCkucoin] = await Promise.all([
        getNobitexPrice(),
        getkucoinPrice()
    ])

    await Promise.all([
        arbitrage(BTCnobitex.sellPrice, BTCkucoin.buyPrice),
        arbitrage(BTCnobitex.buyPrice, BTCkucoin.sellPrice)
    ])


    console.log('==========================================');
    // main();


}

const arbitrage = (BTCnobitex, BTCkucoin) => {

    if (!BTCnobitex || !BTCkucoin)
        return;//main()

    let Dpmin = (BTCkucoin * 0.001) + BTCnobitex * 0.0015;
    var Dp = Math.abs(BTCkucoin - BTCnobitex);
    var m = Dp - Dpmin

    console.log('geymat nobitex : ' + BTCnobitex + ' ba geymat kucoin :' + BTCkucoin + ' ======> ' + Dpmin);

    console.log('Dpmin', Dpmin);
    console.log('Dp : diff tow exchenge = ', Dp);
    console.log('m = Dp - Dpmin =', m + 'profit in 1 btc');

    if (Dp > Dpmin) {

        // if(Sm + m 

        if (BTCkucoin > BTCnobitex) {
            buyBTC(BTCnobitex, BTCkucoin, m, 'nobitex');
        } else {
            buyBTC(BTCkucoin, BTCnobitex, 'kucoin');
        }

    }
}

const getNobitexPrice = async () => {

    let orderbook = await axios.get('https://api.nobitex.ir/v2/orderbook/BTCUSDT')
        .catch(err => console.error(err));

    if (orderbook && orderbook.data)
        return { buyPrice: orderbook.data.bids[0][0], sellPrice: orderbook.data.asks[1][0] };
    else
        return false
}
const getkucoinPrice = async () => {

    let kucoinPrice = await axios.get('https://api.kucoin.com/api/v1/market/orderbook/level2_20?symbol=BTC-USDT')
        .catch(err => console.error(err));

    if (kucoinPrice && kucoinPrice.data && kucoinPrice.data.data) {
        return { buyPrice: kucoinPrice.data.data.bids[0][0], sellPrice: kucoinPrice.data.data.asks[1][0] }
    } else
        return false;

}

function buyBTC(btcPrice, BTCpriceSell, ex) {
    let db = JSON.parse(fs.readFileSync('./dbTest.json', 'utf-8'));

    // var Vb = 0.0002 / (12 - btcPrice * db[ex].fee);

    if (db[ex].usdt >= 12) {
        console.log('buy btc in ', ex)
        db[ex].btc += 12 / btcPrice;
        db[ex].usdt -= 12
        console.log('buy success')

        fs.writeFileSync('./dbTest.json', JSON.stringify(db, null, 4))

        sellBTC(BTCpriceSell, 'kucoin');

        console.dir(counter++);
    }

}
function sellBTC(btcPrice, ex) {
    let db = JSON.parse(fs.readFileSync('./dbTest.json', 'utf-8'));

    if (db[ex].btc >= 0.0002) {
        console.error('sell btc in ', ex)
        db[ex].usdt += 0.0002 * btcPrice;
        db[ex].btc -= 0.0002
        console.error('sell success')

        fs.writeFileSync('./dbTest.json', JSON.stringify(db, null, 4))
    }

}


setInterval(() => {
    main()
    console.log('==========================================');
}, 2500);