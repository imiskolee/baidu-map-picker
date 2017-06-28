(function ($) {
    $.fn.baiduMapPicker = function (options) {
        options = $.extend({}, $.fn.baiduMapPicker.defaults, options);
        var $els = this;

        window.BMap_loadScriptTime = (new Date).getTime();
        $.getScript('http://api.map.baidu.com/getscript?v=2.0&ak=' + options.ak, function () {
            $els.each(function () {
                var map = new BMap.Map(this.id);
                var point = new BMap.Point(options.lng, options.lat);
                map.enableScrollWheelZoom();
                map.enableInertialDragging();
                map.centerAndZoom(point, options.zoom || 18);

                // 添加控件和比例尺
                var top_left_control = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});// 左上角，添加比例尺
                var top_left_navigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
                /*缩放控件type有四种类型: BMAP_NAVIGATION_CONTROL_SMALL：仅包含平移和缩放按钮；BMAP_NAVIGATION_CONTROL_PAN:仅包含平移按钮；BMAP_NAVIGATION_CONTROL_ZOOM：仅包含缩放按钮*/
                map.addControl(top_left_control);
                map.addControl(top_left_navigation);

                // 设置标注
                var marker = new BMap.Marker(point);
                map.addOverlay(marker);
                marker.enableDragging();
                marker.addEventListener('dragend', function (e) {
                    getPointInfo(e.point);
                });

                // 设置标注文字
                var label = new BMap.Label("拖动", {offset: new BMap.Size(20, -10)});
                marker.setLabel(label);

                // 输入地址自动完成
                initAutocomplete();

                // 更新地址信息
                var geoc = new BMap.Geocoder();

                function getPointInfo(point, updateLocalityEl) {
                    geoc.getLocation(point, function (rs) {
                        var comps = rs.addressComponents;
                        updateElVal('latEl', point.lat);
                        updateElVal('lngEl', point.lng);
                        updateElVal('addressEl', rs.address);
                        updateElVal('provinceEl', comps.province);
                        updateElVal('cityEl', comps.province != comps.city ? comps.city : comps.district);
                        updateLocalityEl !== false && updateElVal('localityEl', (comps.province != comps.city ? comps.province + comps.city  : comps.province)  + (comps.province != comps.city ? comps.district : '') + comps.street + comps.streetNumber);
                    });
                }

                function updateElVal(name, val) {
                    if (options[name]) {
                        if (name == 'provinceEl' || name == 'cityEl') {
                            val = removeSuffix(val, ['省', '市', '自治区']);
                        }
                        $(options[name]).val(val);
                        options.updateVal && options.updateVal(name, val);
                    }
                }

                /**
                 * 移除字符串结尾内容
                 */
                function removeSuffix(data, suffixs) {
                    for (var i in suffixs) {
                        // @link http://stackoverflow.com/questions/280634/endswith-in-javascript
                        if (data.indexOf(suffixs[i], data.length - suffixs[i].length) !== -1) {
                            return data.slice(0, -suffixs[i].length);
                        }
                    }
                    return data;
                }

                // 输入地址自动完成
                function initAutocomplete() {
                    var $el = $(options.autocompleteEl);
                    var origValue = $el.val();
                    var ac = new BMap.Autocomplete({
                        input: $el[0],
                        location: map
                    });
                    ac.setInputValue(origValue);

                    ac.addEventListener('onconfirm', function (e) {
                        // FIXME 返回的province为空
                        var comps = e.item.value;
                        var locality = comps.district + comps.street + comps.streetNumber;
                        var address = comps.province + comps.city + locality;
                        var searchAddress = address + comps.business;

                        var local = new BMap.LocalSearch(map, {
                            onSearchComplete: function (result) {
                                // 获取第一个智能搜索的结果
                                var point = result.getPoi(0).point;

                                getPointInfo(point, false);

                                marker.setPosition(point);
                                map.panTo(point);
                            }
                        });
                        local.search(searchAddress);
                    });
                }
            });
        });
    };

    $.fn.baiduMapPicker.defaults = {
        ak: '',
        lat: '22.546054',
        lng: '114.025974',
        addressEl: null,
        provinceEl: null,
        cityEl: null,
        localityEl: null,
        latEl: null,
        lngEl: null,
        autocompleteEl: null,
        updateVal: null
    };

    function  BaiduMapPicker(config) {
        this._id  += 1;
        this.config = config;
        this.map_container_id = 'baidu-map-picker-map-container-' + this._id;
        this.container_id = 'baidu-map-picker-map-container-' + this._id;
        this.initFunc();
    }
    BaiduMapPicker.prototype._id = 0;

    BaiduMapPicker.prototype.initFunc = function() {

        var _template = '<style>.tangram-suggestion{z-index:99999}</style><div style="position: fixed;z-index:9999;top:0;left:0;bottom:0;right:0;padding:20px;background: rgba(255,255,255,.85);" id="baidu-map-container">' +
            '<div class="row"><div class="col-xs-8"><form><div class="form-group"><input type="text" class="form-control" id="baidu-map-picker-search-el" placeholder="输入地理位置，自动搜索...."></div></form></div> <div class="col-xs-4"><div class="btn btn-default">搜索</div></div></div>' +
            '<div class="row"><div class="col-sm-8"><div class="map-container" id="'+(this.map_container_id)+'" style="width:100%;height:500px;"></div></div>' +
            '<div class="col-sm-4">' +
            '<form>' +
            '<div class="form-group">'+
                '<label style="color:#FFF">经度</label>' +
                 '<input type="text" class="form-control" id="baidu-map-picker-lat-el" placeholder="">' +
            '</div>' +
        '<div class="form-group">'+
        '<label for="lat"  style="color:#FFF">纬度</label>' +
        '<input type="text" class="form-control" id="baidu-map-picker-lng-el" placeholder="">' +
        '</div>' +
        '<div class="form-group">'+
        '<label for="lat"  style="color:#FFF">地址</label>' +
        '<textarea type="text" class="form-control" id="baidu-map-picker-address-el" placeholder="" style="height:6em"></textarea>' +
        '</div>' +
            '<div class="form-group">' +
            '<div class="btn btn-warning btn-block" id="baidu-map-close-btn">取消</div>' +
            '</div>' +
            '<div class="form-group">' +
            '<div class="btn btn-success btn-block" id="baidu-map-select-btn">选择</div>' +
            '</div>' +
            '</form>' +
            '</div></div>' +
            '</div>'
            $('body').append(_template);

        var de = {
            autocompleteEl:'#baidu-map-picker-search-el',
            latEl : '#baidu-map-picker-lat-el',
            lngEl: '#baidu-map-picker-lng-el',
            'localityEl' : '#baidu-map-picker-address-el'
        };

        for(var index in de) {
            this.config[index] = de[index];
        }

        if(this.config.lat) {
            $(de.latEl).val(this.config.lat);
        }
        if(this.config.lng) {
            $(de.lngEl).val(this.config.lng);
        }
        if(this.config.text) {
            $(de.localityEl).val(this.config.text);
        }
        $('#' + this.map_container_id).baiduMapPicker(this.config);

        var _this = this;
        $('#baidu-map-close-btn').on('click',function(){
            _this.close();
            $(document).trigger('baidu-map-picker.close');
        });
        $('#baidu-map-select-btn').on('click',function(){

            var _val = {
                lat : $('#baidu-map-picker-lat-el').val(),
                lng: $('#baidu-map-picker-lng-e').val(),
                text: $('#baidu-map-picker-address-el').val()
            };
            $(document).trigger('baidu-map-picker.select',_val);
            _this.close();
        })

    }

    BaiduMapPicker.prototype.close = function() {

        $('#baidu-map-container').remove();

    }

    window.BaiduMapPicker = BaiduMapPicker;
}(jQuery));