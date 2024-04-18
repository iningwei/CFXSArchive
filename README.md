老符文合约地址：``0xc6e865c213c89ca42a622c5572d19f00d84d7a16``   简称7a16

新符文合约地址： ``0xd3a4d837e0a7b40de0b4024fa0f93127dd47b8b8``   简称b8b8

ERC20 coin合约地址: ``0xb747a3317259e0aafe5a242c8e3f042a4b83627a``


老符文的采集之战已是久远的传说，老新符文以及coin的兑换/转换确实麻烦，笔者梭理下使用[0x01010110](https://github.com/0x01010110)大哥的兑换工具、以及cryptoli的合并工具的大概流程和一些注意事项。
## 1，兑换（主网老符文兑换为新符文）
[工具地址](https://github.com/0x01010110/corecfxs/blob/main/readmezh.md#%E5%85%91%E6%8D%A2-core-space-%E6%89%93%E5%88%B0%E7%9A%84-cfxs)

step1:安装node.js

step2:下载工程到本地，定位到corecfxs-main目录下。执行：``npm install``安装依赖

step3:复制粘贴config.json.sample文件，并命名为config.json，内容如下：
```json
{
    "privateKey": "0x<core space私钥>",
    "gasPrice": 1,
    "url": "https://main.confluxrpc.com",
    "networkId": 1029,
    "cfxs": "0xc6e865c213c89ca42a622c5572d19f00d84d7a16",
    "eSpaceUrl": "https://evm.confluxrpc.com",
    "exchangeContract": "0x5c3c1a119300669990863861a854616ecb04b463",
    "newCfxs": "0xd3a4d837e0a7b40de0b4024fa0f93127dd47b8b8",
    "eSpacePrivateKey": "0x<e space私钥>"
}
```
只有3个参数需要改动：
- privateKey 
>若是core space的老符文兑换为新符文，则需要把对应钱包core space的私钥填写进去即可，最终形如：``"privateKey": "0xXXXXXXXXX"``，即0x后面紧跟着私钥。
- gasPrice
>默认好像是200，目前网络不堵，设置1即可，笔者测试设置为1，2，3消耗gas都是0.01125
- eSpacePrivateKey
>若是需要把e网下的老符文兑换为新符文，则把e网私钥填写这里

step4:启动脚本 ``node exchangeCfxs.js``
转换过程可能会有失败，需要多次执行。最终可以通过下文中提到的查询命令，查询新老cfxs数量是否一致来判断是否转换完全。该工具老符文兑换新符文，每次是4个，消耗gas最低：0.01125cfx


### 1.1,工具自带的一些查询命令
对于主网打的cfxs，其实是映射到了一个e网地址，这个地址我们控制不了。主网上老cfxs转换为新cfxs符文后，映射的也是这个地址。

- 1,获取主网cfxs的映射地址
>node ./cfxs.js mappedAddress

- 2,查询（映射地址下）老cfxs的数量
>node ./cfxs.js cfxsBalance

- 3,查询（映射地址下）新cfxs的数量
>node ./cfxs.js newCfxsBalance

### 1.2，e网老符文兑换新符文
依旧使用上述0x01010110的工具，只是要配置e网的私钥。

然后执行 ``node espace/eSpaceExchangeCfxs.js``。由于本身就在e网，账户自己可控，无需转移。

由于指令是独立的，所以json文件可以既配置主网私钥又配置e网私钥，两者不会冲突


## 2,转移
若符文是在主网打的，需要把主网兑换后的新CFXS从映射地址转移到e网上一个我们自己可以控制的账户
``node transferCfxs.js <receiver-e space address>``
 

工具每次可以转移8个，gas费用约 0.010374cfx

转移后再执行``node ./cfxs.js newCfxsBalance``，若个数为0，则可判定转移完了。

 
## 3，合并
>合并的目的是方便交易。符文是有编号的，由于cfxs总量为2100W因此初始编号为1-2100000，合并后原始会丢失。再拆开后会生成新的编号，从30000000开始。因此对于老编号，若有自己喜欢的号码，或者靓号，可以保留不合并，市场也有人专门收购此类靓号。

- 法1：开发人员提供的网页工具
>在官方网站 https://www.cfxs.world/market/general 提供了合并工具，在[如何玩转cfxs符文](https://github.com/iningwei/CFXSArchive/blob/master/%E5%A6%82%E4%BD%95%E7%8E%A9%E8%BD%ACcfxs%E7%AC%A6%E6%96%87.pdf)有详细介绍，但是是手动的，很麻烦。

- 法2：网页合约操作
>在[b8b8合约](https://evm.confluxscan.net/address/0xd3a4d837e0a7b40de0b4024fa0f93127dd47b8b8)中输入参数来合并，有热心技师录了视频:[视频1](https://github.com/iningwei/CFXSArchive/blob/master/%E6%8A%80%E5%B8%88%E7%BD%91%E9%A1%B5%E5%90%88%E7%BA%A6%E5%90%88%E5%B9%B6%E6%96%B0cfxs%E7%AC%A6%E6%96%871.mp4),[视频2](https://github.com/iningwei/CFXSArchive/blob/master/%E6%8A%80%E5%B8%88%E7%BD%91%E9%A1%B5%E5%90%88%E7%BA%A6%E5%90%88%E5%B9%B6%E6%96%B0cfxs%E7%AC%A6%E6%96%872.mp4)，相对法1提高了效率，但是依旧恶心。
```
[["0x地址",24, "+++"]]
```

- 法3：脚本法
>使用cryptoli大佬提供的[MergeCFXs](https://github.com/cryptoli/MergeCFXs)，按文档说明配置好私钥。执行``node cfxs.js``即可自动合并。
  
1次合并24个，gas费约 0.043887cfx
## 4，虫洞（符文转换为可批量交易coin）
去 https://www.cfxs.world/ 网站虫洞转换，然后在钱包中添加合约 ``0xb747a3317259e0aafe5a242c8e3f042a4b83627a`` 即可看到最终的coin信息

![](https://github.com/iningwei/CFXSArchive/blob/master/%E7%AC%A6%E6%96%87%E5%88%B0coin%E8%99%AB%E6%B4%9E.png)

当然coin依旧可以反转为符文，符文也可以拆分，具体参考``如何玩转cfxs符文``


## 5，gas花费
- 兑换（老符文转新符文）：x/4*0.01125
- 转移：x/8*0.010374
- 合并：x/24*0.043887
- 虫洞：0.02左右一次

再次吐槽，gas 真贵！！！

## 6，一些符文靓号，欢迎选购
[我的靓号们](https://github.com/iningwei/CFXSArchive/blob/master/%E6%AC%A2%E8%BF%8E%E9%80%89%E8%B4%AD%E9%9D%93%E5%8F%B7.md)

## 7，捐赠
CFXS开发作者受捐erc20地址：0x7d029736015E83665FdDFf98eE6BE1f601f025a2

## 8，其它
cfxs官网升级后导致合并脚本api不正确，需要把合并工程cfxs.js脚本中的这一句：
```js
const url = `https://www.cfxs.world/api/cfxs/my/new?index=${index}&merged=0&owner=${wallet.address}&size=60`;
```
修改为：
```
const url = `https://www.cfxs.io/api/cfxs/my/new?index=${index}&merged=0&owner=${wallet.address}&size=60`;
```