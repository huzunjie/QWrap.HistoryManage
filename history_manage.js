/*  HistoryManage */
(function(window,document){
    var mix = QW.ObjectH.mix,
        CustEvent = QW.CustEvent,
        EventTargetH = QW.EventTargetH,
        on = EventTargetH.on,
        un = EventTargetH.un,
        ObjectH = QW.ObjectH,
        encodeURIJson = ObjectH.encodeURIJson,
        isPlainObject = ObjectH.isPlainObject,
        isFunction = ObjectH.isFunction,
        setObject = ObjectH.set,
        _queryUrl = QW.StringH.queryUrl,
        _queryCache = {},
        loca = window.location;

    /*** 页面浏览历史管理类 *** 
    *  (目前主要用于客户端弹窗,暂不考虑 history.pushState, 仅做location.hash相关监听处理 ) *
    */
    function HistoryManage(opts){

        opts = opts||{};
        
        this.changeHandler = isFunction(opts)? opts : opts.change;
        this._delayTime = opts.delayTime || 50; //对于不支持onhashchange的浏览器启用定时器监控时的帧时长 [毫秒]

        this._init();

    };

    mix(HistoryManage.prototype,{

        _init:function(){

            /* Events change 自定义方法...
            *  默认只有change方法,使用者可以在 this.on("change"... 逻辑中fire自定义方法名称(比如根据 this.fire(this.getParams("action"))...)
            */
            CustEvent.createEvents(this);
            
            //change事件监听方法
            this.changeHandler && this.on("change",this.changeHandler);

            //默认启动监视器
            this.start();

        },

        //增强queryUrl: 增加缓存,减少重复Str2Json操作
        queryUrl: function(url,key){
            var queryObj = _queryCache[url] || (_queryCache[url] = _queryUrl(url));
            return key?queryObj[key]:queryObj;
        },

        //取得完整的hash字符串
        getHashStr:function(){
            return loca.hash.substr(1);
        },

        //取得hash中的K/V对,输出为JSON对象
        getHashParams:function(key){
            return this.queryUrl(this.getHashStr(),key);
        },

        /*** 设置hash中的参数 ** 
        * 多态支持:
        *      1. 通过K/V对设置某个参数
        *      2. key作为字符串[此时直接改写hash]
        *      3. key作为json对象[合并当前JSON到原有数据中,此时如果val==true则直接覆盖原JSON]
        *      4. key和val均未设置 则清空hash
        */
        setHashParams:function(key,val,notFireChange){
            if(key){
                var params = this.getHashParams();
                if(isPlainObject(key)){
                    params = encodeURIJson(val?key:mix(params,key,true));
                }else{
                    params = val==undefined? encodeURIComponent(key) : encodeURIJson(setObject(params,key,val));
                }
            }else{
                params = "";
            }
            if(notFireChange){
                this._oldHash = params;
            }
            loca.hash = params;
            return this;
        },

        //取得get参数,输出为JSON对象(不支持pushState 所以urlParams不提供set方法)
        getUrlParams:function(paramKey){
            return this.queryUrl(loca.href,paramKey);
        },

        _monitorStatus: 0,
        _oldHash: null,
        //启动监视器
        start:function(){
            var _t = this;

            //避免重复监听
            if(_t._monitorStatus)return _t;

            _t._monitorStatus = 1;
                if ('onhashchange' in window) {
                    var hashChangeHandler = _t._hashChangeHandler = function() {
                        _t.fire("change");
                        _t._oldHash = _t.getHashStr();
                    };
                    on(window, 'hashchange', _t._hashChangeHandler);

                    //第一次打开，默认主动触发一下
                    if(_t._oldHash != _t.getHashStr()){
                        hashChangeHandler();
                    }
                } else {
                    (function() { //针对不支持onhashchange的浏览器用于hash状态检测，这里采用setTimeout有待优化
                        var hashStr = _t.getHashStr();
                        if(_t._oldHash != hashStr){
                            _t.fire("change");
                            _t._oldHash = hashStr;
                        }
                        _t._monitorTimer = setTimeout(arguments.callee, _t._delayTime);
                    })();
                }
        },

        //终止监视器
        stop:function(argument) {
            var _t = this;
            _t._monitorStatus = 0;
            if(_t._monitorTimer){
                clearTimeout(_t._monitorTimer);
                delete _t._monitorTimer;
            }else{
                _t._timerHandler && un(window, 'hashchange', _t._timerHandler);
            }
        }

    });

    window.HistoryManage = QW.HistoryManage = HistoryManage;
    /*  页面URL History 管理器 end */    

})(window,document);

