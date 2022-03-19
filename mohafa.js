//This script is the result of the efforts of Mohammad Hassan Fallah
const axios = require('axios')
const fs = require('fs')

const Ex1 = 'nobitex'
const Ex2 = 'kucoin'
const f1 = 0.001
const f2 = 0.0015
const L = 0.0002
const d = 0.1
var Sm = 0
var mC = 0;
var Smc = 0;
var mr = 0;
const feeArr = [0.001, 0.0015]
const ExArr = ['nobitex', 'kucoin']
// var step = L


async function loop() {

    console.log('in loop');
    var [BTCnobitex, BTCkucoin] = await Promise.all([
        getNobitexPrice(),
        getkucoinPrice()
    ])
    if (!BTCnobitex.sellPrice || !BTCkucoin.sellPrice) {
        console.log('not get price from ex');
        // return await loop();
    }

    var Ps1 = BTCnobitex.sellPrice;
    var Pb1 = BTCnobitex.buyPrice;
    var Ps2 = BTCkucoin.sellPrice;
    var Pb2 = BTCkucoin.buyPrice;

    await Promise.all([
        main(Ps1, Pb2, Ps2, Pb1),
        main2(Ps2, Pb1, Ps1, Pb2)
    ])
    // await main(Ps1, Pb2, Ps2, Pb1)

    // await loop();

}




async function main(Ps1, Pb2, Ps2, Pb1) {
    // فروش در صرافی اول
    console.log('in main 1 ps1 ' + Ps1 + ' pb2 ' + Pb2);
    var Dpmin1 = (Ps1 * f1) + ((Pb2 * f2) / (1 - f2));
    var Dp1 = Ps1 - Pb2;

    console.log('Dpmin1', Dpmin1);
    console.log('Dp1', Dp1);

    if (Dp1 > Dpmin1) {
        var m = Dp1 - Dpmin1;
        console.log('in if adm m = ', m);

        if (m >= Math.abs(mC)) {
            // var Bs1 = //موجودی برای فروش در صرافی 1
            // var Vs1 = //موجودی برای فروش در صرافی 1

            if (getBalance('nobitex', Ps1, 'btc') && getBalance('kucoin', Pb2, 'usdt')) { //موجودی بالاتر از لیمیت باشه
                var Value = Arbitrage(Ps1, Pb2, Dp1, Dpmin1, 2);
                Sm = Sm + m;

                mr = mr + (m * Value);
            } else {
                Smc = Sm * d;
                var Dpmin2 = (Ps2 * f2) + ((Pb1 * f1) / (1 - f1));
                var Dp2 = Ps2 - Pb1;
                m = Dp2 - Dpmin2;
                if (Sm + m >= Smc) {
                    var Value = Arbitrage(Ps2, Pb1, Dp2, Dpmin2, 1);
                    Sm = Sm + mC;
                    mr = mr + (m * Value);

                }
            }
        }
    }
}

async function main2(Ps2, Pb1, Ps1, Pb2) {
    // فروش در صرافی دوم
    console.log('in main 2');
    var Dpmin2 = (Ps2 * f2) + ((Pb1 * f1) / (1 - f1));
    var Dp2 = Ps2 - Pb1;

    console.log('Dpmin2', Dpmin2);
    console.log('Dp2', Dp2);

    if (Dp2 > Dpmin2) {
        var m = Dp2 - Dpmin2;
        console.log('in if adm m2 = ', m);

        if (m >= Math.abs(mC)) {

            if (getBalance('kucoin', Ps2, 'btc') && getBalance('nobitex', Pb1, 'usdt')) { //موجودی بالاتر از لیمیت باشه
                var Value = Arbitrage(Ps2, Pb1, Dp2, Dpmin2, 1);
                Sm = Sm + m;

                mr = mr + (m * Value);
            } else {
                Smc = Sm * d;
                var Dpmin1 = (Ps1 * f1) + ((Pb2 * f2) / (1 - f2));
                var Dp1 = Ps1 - Pb2;
                m = Dp1 - Dpmin1;
                if (Sm + m >= Smc) {
                    var Value = Arbitrage(Ps1, Pb2, Dp1, Dpmin1, 2);
                    Sm = Sm + mC;
                    mr = mr + (m * Value);

                }
            }
        }
    }
}

function Arbitrage(Ps, Pb, Dp, Dpmin, exBuy) {
    if (exBuy == 1) var exSell = 2
    else var exSell = 1
    // let PS = sellBTC(11,ExS) //Sell Price in ExS;
    // let PB = buyBTC(11,22,ExB) //Buy Price in ExB;

    // VS = ps * L // Sell Order Volume in ExS;
    // VB = L // Buy Order Volume in ExB;

    // if (VB <= VS || (VB < (VS / (1 - feeArr[exBuy]))) ) { // اینکه متوجه بشیم که حجم معامله چقدر باید باشد
    //     var V = VB;
    //     sellBTC()
    //     Sell V(1 - fB) in ExS with PS;
    //     Buy V in ExB with PB;
    // } else if (VB >= VS / (1 – fB)) {
    // V = VS;
    var V = L;
    sellBTC(Ps, ExArr[exSell - 1], V) // Sell V in ExS with PS;
    buyBTC(Pb, ExArr[exBuy - 1], V / (1 - feeArr[exBuy - 1])) //Buy V / (1 – fB) in ExB with PB;

    // }

    // mr = mV;
    return V;
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
const getBalance = async (ex, btcprice, cur) => {

    let db = JSON.parse(fs.readFileSync('./dbTest.json', 'utf-8'));

    if (cur == 'btc')
        var limit = L
    else
        var limit = L * btcprice

    if (db[ex][cur] >= limit) {
        return db[ex].btc;
    }

    return false;

}
function buyBTC(btcPrice, ex, value) {
    let db = JSON.parse(fs.readFileSync('./dbTest.json', 'utf-8'));

    // var Vb = L / (12 - btcPrice * db[ex].fee);

    var limitUsdt = btcPrice * L
    var usdtValue = btcPrice * value

    if (db[ex].usdt >= limitUsdt && db[ex].usdt >= usdtValue) {
        console.log('buy btc in ', ex)
        db[ex].btc += value;
        db[ex].usdt -= usdtValue
        console.log('buy success')

        fs.writeFileSync('./dbTest.json', JSON.stringify(db, null, 4))

        // sellBTC(BTCpriceSell, 'kucoin');

        // console.dir(counter++);
    }

}
function sellBTC(btcPrice, ex, value) {
    let db = JSON.parse(fs.readFileSync('./dbTest.json', 'utf-8'));

    if (db[ex].btc >= value) {
        console.error('sell btc in ', ex)
        db[ex].usdt += value * btcPrice;
        db[ex].btc -= value
        console.error('sell success')

        fs.writeFileSync('./dbTest.json', JSON.stringify(db, null, 4))
    }

}

setInterval(() => {

    loop()
}, 3000);