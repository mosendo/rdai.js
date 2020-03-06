 <div align="center">
  <h2>rDAI.js</h2> 
</div>

### Build file:
[/build/index.js](/build/index.js)

### self-host/cdn

```
<script src="build/index.js"></script>
ethereum.enable();
let RedeemDai = window.RedeemDai.default;
let rDai = new RedeemDai(window.web3);
rDai.mint(amount);
```

*Note on using `amount` - if type is number, assumed to be human readable, if type is string/BN, assumed to be base units.*

View [/src/index.js](/src/index.js) for available functions
