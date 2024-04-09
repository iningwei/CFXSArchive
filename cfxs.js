
const { Contract, JsonRpcProvider, Wallet } = require('ethers');
const axios = require('axios');
const config = require('./config.json');
const cfxsMainMeta = require('./CFXsMain.json');

const provider = new JsonRpcProvider(config.url);
const cfxsMainContract = new Contract(config.CFXsAddress, cfxsMainMeta.abi, provider);
const wallet = new Wallet(config.privateKey, provider);
let cfxsMainContract1 = cfxsMainContract.connect(wallet);
let liangCount=0;//靓号个数

async function fetchData(index) {
    const url = `https://www.cfxs.world/api/cfxs/my/new?index=${index}&merged=0&owner=${wallet.address}&size=60`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null;
    }
}

async function getAllIds() {
    let index = 0;
    let allIds = [];


    while (true) {
        const data = await fetchData(index);

        if (!data || data.rows.length === 0) {
            break;
        }
        const ids = data.rows.map(entry => ({ id: parseInt(entry.id), amount: entry.amount }));
        //console.log("获取到IDs：", ids)
        const nonLiangHaoIds=ids.filter(entry=>!isLiang(entry.id)); //获得所有的非靓号
        allIds = allIds.concat(nonLiangHaoIds);
        index += 60;       
    }

    const idsChunks = [];
    for (let i = 0; i < allIds.length; i += config.mergeNum) {
        idsChunks.push(allIds.slice(i, i + config.mergeNum));
    }

    return idsChunks;
}

async function callProcessTransaction() { 
    const idsChunks = await getAllIds();
    console.log("liang count:"+liangCount);
    //return;
    const totalChunks = idsChunks.length;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const ids = idsChunks[chunkIndex];
        try {
            // 计算每组的总amount
            const totalAmount = ids.reduce((total, id) => total + id.amount, 0);

            // 创建包含每组总amount的output
            let output = [{ owner: wallet.address, amount: totalAmount, data: '' }];

            const tempIds = ids.map(id => id.id);
            console.log("合并Ids：", tempIds, "， 合并后数量：", totalAmount);

            // 计算当前循环的百分比进度
            const progress = ((chunkIndex + 1) / totalChunks) * 100;
            console.log(`进度：${progress.toFixed(2)}%`);

            // 调用区块链交易处理函数
            const tx = await cfxsMainContract1.processTransaction(tempIds, output);
            await tx.wait();

            console.log('合并成功!');
        } catch (error) {
            console.error('合并失败:', error);
        }
    }
}

//靓号规则
//前10000的，比如1382；前100000的，有连续4个数字就满足，比如25555、33331；有5位或更多连续相同数字，比如3555552；
//连续5个或更多数字按等差数列排列的，比如20345671和1357943；
//有AABBCC、AAABBB、AAAABB、AABBBB、ABABAB、ABCABC、ABCDABCD类型的，比如33881132、353535、236236、14831483；
//以888、666、520、521开头或者结尾的;
//回文数，比如3421243
function isLiang(number)
{
    let isPrettyNumber = isTopTenThousand(number) ||
    hasContinuousFourDigits(number) ||
    isSameDigits(number) ||
    isPalindrome(number)||
    isArithmeticSequence(number) ||
    isSpecialType(number);

    if(isPrettyNumber)
    {
        liangCount++;
        console.log(number+" is liang");
    }
    return isPrettyNumber;
}
// 判断是否为前10000的靓号
function isTopTenThousand(number) {
    return number <= 10000;
}

// 判断是否为前100000的靓号（有连续4个数字）
function hasContinuousFourDigits(number) {
    if (number > 100000) {
        return false;
    }
    let numString = number.toString();
    for (let i = 0; i < numString.length - 3; i++) {
        let count = 1;
        for (let j = i + 1; j < numString.length; j++) {
            if (parseInt(numString[j]) - parseInt(numString[j - 1]) === 1) {
                count++;
                if (count === 4) {
                    return true;
                }
            } else {
                count = 1;
                break;
            }
        }
    }
    return false;
}

// 判断是否为5位或更多连续相同数字的靓号
function isSameDigits(number) { 
    if (number < 10000) {
        return false;
    }
    let numString = number.toString();
    for (let i = 0; i < numString.length - 4; i++) { 
        //let rStr=numString.substring(i, i + 5).replace(numString[i], ' ').trim();//js中replace只能替换第一个符合的字符，不是全部替换 
        let rStr=numString.substring(i, i + 5);
        rStr= rStr.split('').map(char => char === numString[i] ? ' ' : char).join('').trim(); 
        if (rStr == "") {
            console.log("fit sameDigits:" + number);
            return true;
        }
    }

     
    return false;
}

// 判断是否为连续5个或更多数字按等差数列排列的靓号 :14567811
function isArithmeticSequence(number) {
    let numString = number.toString();
    for (let i = 0; i < numString.length - 4; i++) {
        let difference = numString[i + 1] - numString[i];
        let isSequence = true;
        for (let j = i + 1; j < numString.length; j++) {
            if (numString[j] - numString[j - 1] !== difference) {
                isSequence = false;
                break;
            }
        }
        if (isSequence) {
            console.log(number + " fit arithmetic sequence");
            return true;
        }
    }
    return false;
}

//回文数
function isPalindrome(num) {
    // 如果是负数或者个位数为0的数字，都不是回文数
    if (num < 0 || (num % 10 === 0 && num !== 0)) {
        return false;
    }

    let reversedNum = 0;
    let originalNum = num;

    // 将数字逆序
    while (num > 0) {
        reversedNum = reversedNum * 10 + num % 10;
        num = Math.floor(num / 10);
    }

    // 判断逆序后的数字是否与原始数字相等
    let result= originalNum === reversedNum;
    if(result){
        console.log(originalNum+" is palindrome");
    }
    return result;
}

// 判断是否为指定类型的靓号
function isSpecialType(number) {
    let numString = number.toString();

    // AABBCC、AAABBB、AAAABB、AABBBB 
    if (numString.length >= 6) {
        for (let i = 0; i < numString.length - 6; i++) {
            let subStr = numString.substring(i, i + 6);
            if ((subStr[0] === subStr[1] && subStr[2] === subStr[3] && subStr[4] === subStr[5]) || // AABBCC
                ((subStr[0] === subStr[1] && subStr[1] === subStr[2]) && (subStr[3] === subStr[4] && subStr[4] === subStr[5])) || // AAABBB
                ((subStr[0] === subStr[1] && subStr[1] === subStr[2] && subStr[2] === subStr[3]) && subStr[4] === subStr[5]) || // AAAABB
                ((subStr[2] === subStr[3] && subStr[3] === subStr[4] && subStr[4] === subStr[5]) && subStr[0] === subStr[1])) { // AABBBB
                return true;
            }
        }
    }

    // ABABAB、ABCABC
    if (numString.length >= 6) {
        for (let i = 0; i < numString.length - 6; i++) {
            let subStr = numString.substring(i, i + 6);
            if (((subStr[0] === subStr[2] && subStr[2] === subStr[4]) && (subStr[1] === subStr[3] && subStr[3] === subStr[5])) || // ABABAB
                (subStr[0] === subStr[3] && subStr[1] === subStr[4] && subStr[2] === subStr[5])) { // ABCABC 
                return true;
            }
        }
    }
    // ABCDABCD、AAAABBBB
    if (numString.length >= 8) {
        for (let i = 0; i < numString.length - 8; i++) {
            let subStr = numString.substring(i, i + 8);
            if (((subStr[0] === subStr[4] && subStr[1] === subStr[5]) && (subStr[2] === subStr[6] && subStr[3] === subStr[7])) ||// ABCDABCD 
                (((subStr[0] === subStr[1] && subStr[1] === subStr[2]) && (subStr[2] === subStr[3]) && (subStr[4] === subStr[5] && subStr[5] === subStr[6] && subStr[6] === subStr[7])))) { //AAAABBBB
                return true;
            }
        }
    }

    // 以888、666、520、521开头或者结尾的
    if (numString.startsWith("888") || numString.startsWith("666") || numString.startsWith("520") || numString.startsWith("521") ||
        numString.endsWith("888") || numString.endsWith("666") || numString.endsWith("520") || numString.endsWith("521")) {
        return true;
    }

    return false;
}

 



callProcessTransaction();
