/**
* 获取天地图wmts服务图层实例
*
* @param {String} t
* 1.'vec_c' 全球矢量地图服务
* 2.'img_w' 全球影像地图服务
* 3.'cva_c' 全球矢量中文注记服务
* 4.'img_c' 全球影像底图服务
* 5.'cia_c' 全球影像中文注记服务
* 6.更多服务可查询http://www.tianditu.com/service/query.html#
* @returns
*/
var map = null;//地图对象
var MapSetInfo = { zoomindex: 10, centerx: 114.331040, centery: 30.622702 };//地图全图范围设置参数
var arrLayers = new Array();
var tdtlyr = null;//天地图图层
var tdtbzlyr = null;//天地图备注文字图层
var vector = null;	// 地图点击画图
var vectorsource = null;	// 图源对象
var currentAddedFeature = null;	// 当前添加的标注
var dicUploadFiles = new Dictionary(); // 上传成功的图片名称字典
var dicAddedTag = new Dictionary(); // 已经添加的地物字典
var currentObject = null; // 当前正在操作的地物对象

var C_AJAX_HANDLER_URL = "./Handler/AjaxHandler.ashx";
var C_FILE_HANDLER_URL = "./Handler/FileHandler.ashx";
var C_TAG_IMAGE = "./icon/point_6.png";
var C_PROJECTION = "EPSG:4326";

$(function () {
	$('#LoadingModal').modal();
	try{
		InitMap();
    
		InitEvent();
		
		InitPlugins();
		
		InitPage();
	}
	catch(e){}
});

function HideLoadingModalDlg(){
	$('.modal-backdrop').remove();
	$('#LoadingModal').remove();
}

function GetSummaryMsg(szContent){
	if (szContent.length > 10){
		return szContent.substr(0, 10) + '......';
	}
	return szContent;
}

function InitPage(){
	// 获取已经添加的标注
	var dt = {};
	dt.action = "getalltag";
	$.ajax({
		url : C_AJAX_HANDLER_URL,
		data : dt,
	})
	.done(function(msg) {
		try{
			msg = jQuery.parseJSON(msg);
			var iCnt = msg.T_TargetObject.length;
			if (iCnt > 0){
				for (var i in msg.T_TargetObject) {
					var obj = msg.T_TargetObject[i];
					dicAddedTag.set(obj.ID, obj);
					feature = new ol.Feature({
						geometry: new ol.geom.Point([obj.Lon, obj.Lat]),
						name: obj.TargetName,
						objid: obj.ID,
						msg: GetSummaryMsg(obj.TargetDesc)
					});
					feature.setId(obj.ID);
					vectorsource.addFeature(feature);
				}
			}
		}
		catch(e){}
		HideLoadingModalDlg();
	})
	.fail(function() {
		promptError('获取已添加的标注点失败!');
		HideLoadingModalDlg();
	});
}

function InitPlugins(){
	// 提示框控件
	toastr.options.positionClass = 'toast-bottom-right';
	toastr.options.timeOut = 5000;
}

function InitMap(){
	tdtlyr = getTdtLayer("vec_c");
    tdtbzlyr = getTdtLayer("cva_c");
    arrLayers.push(tdtlyr);
    arrLayers.push(tdtbzlyr);
	
	vectorsource = new ol.source.Vector({});
	vector = new ol.layer.Vector({
		source: vectorsource,
		style: new ol.style.Style({
			image: new ol.style.Icon({
				src: C_TAG_IMAGE, scale: 0.5, anchor: [0.5, 1] 
			}),
			zIndex: 100000 
		})
	});
    arrLayers.push(vector);
	
    map = new ol.Map({
        layers: arrLayers,
        target: document.getElementById('map'),
        view: new ol.View({
            projection: C_PROJECTION,
            center: [MapSetInfo.centerx, MapSetInfo.centery],
            zoom: MapSetInfo.zoomindex,
            minZoom: 5,
            maxZoom: 20
        }),
        interactions: new ol.interaction.defaults({
            altShiftDragRotate: false,
            pinchRotate: false,
        })
    });

    var clist = map.getControls().getArray();//获取地图上当前已有的工具控件 并进行移除
    for (var i = clist.length - 1; i > -1; i--) {
        map.removeControl(clist[i]);
    }
	
	// 初始化点击事件
	var popup = new ol.Overlay({
		element: document.getElementById('popup'),
		positioning: 'bottom-center',
		stopEvent: false,
		offset: [0, -50]
	});
	map.addOverlay(popup);
	
	map.on('click', function(evt) {
		var feature = map.forEachFeatureAtPixel(evt.pixel,
			function(feature) {
				return feature;
		});
		
		$("#popup").popover('dispose');
		if (feature) {
			var coordinates = feature.getGeometry().getCoordinates();
			popup.setPosition(coordinates);
			$("#popup").popover({
				'placement': 'top',
				'html': true,
				'title' : feature.get('name'),
				'content': '<a href="#" title="点击查看详情" onclick="OnViewTag(\'' + feature.get('objid') + '\')">' + feature.get('msg') + '</a>'
			})
			$("#popup").popover('show');
		}
	});

	// change mouse cursor when over marker
	map.on('pointermove', function(e) {
		if (e.dragging) {
			$("#popup").popover('dispose');
			return;
		}
		var pixel = map.getEventPixel(e.originalEvent);
		var hit = map.hasFeatureAtPixel(pixel);
		map.getTarget().style.cursor = hit ? 'pointer' : '';
	});
}

function OnViewTag(objID){
	$("#popup").popover('dispose');
	currentObject = dicAddedTag.get(objID);
	if (currentObject){
		if (currentObject.RealImages.length > 0){
			ResetFileInput(currentObject.RealImages, objID);
		}
		else{
			ResetFileInput(null, null);
		}

		showSideBar(true);
		$('#iptName').val(currentObject.TargetName);
		$('#iptDesc').val(currentObject.TargetDesc);
		$('#iptLonLat').val(currentObject.Lon + ';' + currentObject.Lat);
		$('#btnDelete').show();
	}
}

function GetImagesPreviewConfig(szImageNames, objectID){
	var arrRet = new Array();
	var arrImageName = szImageNames.split(';');
	for(var i in arrImageName){
		var obj = {};
		obj.url = '../Handler/FileHandler.ashx';
		obj.key = objectID;
		obj.extra = {};
		obj.extra.name = arrImageName[i];
		obj.extra.action = "deleteimg";
		arrRet.push(obj);
	}
	return arrRet;
}

function GetImagesUrl(szImageNames){
	var currentURL = window.location.href;
	var root = currentURL.substr(0, currentURL.lastIndexOf('/') + 1);
	var arrImageName = szImageNames.split(';');
	for(var i in arrImageName){
		arrImageName[i] = root + 'uploadimages/' +arrImageName[i];
	}
	return arrImageName;
}

function InitEvent(){
	// 点击添加标注菜单项
	$("#addtag").on('click', function(){
		OnAddTag();
	});

	// 点击取消按钮
	$("#btnCancel").on('click', function(){
		if (currentAddedFeature != null)
		{
			vectorsource.removeFeature(currentAddedFeature);
			currentAddedFeature = null;
		}
		
		// 启用下拉菜单
		$('#menuAddTag').removeClass("disabled");
		
		// 隐藏侧边栏输入详细信息
		showSideBar(false);
	});
	
	// 点击保存按钮
	$('#btnSave').on('click', function(){
		if (validMask() == false)
			return;
		
		var dt = {};
		dt.name = $("#iptName").val();
		dt.desc = $("#iptDesc").val();
		dt.lonlat = $("#iptLonLat").val();
		dt.targetid = (currentObject == undefined || currentObject == null) ? "" : currentObject.ID;
		if (dt.targetid === ""){
			dt.action = "addnewtag";
			dt.imgs = dicUploadFiles.getStrValue(';');
		}
		else{
			dt.action = "updatetag";
			dt.imgs = currentObject.RealImages;
			if (dicUploadFiles.size() > 0){
				if (dt.imgs.length > 0)
					dt.imgs += ";";
				dt.imgs += dicUploadFiles.getStrValue(';');
			}
		}

		// 提交数据
		$.ajax({
			url : C_AJAX_HANDLER_URL,
			data : dt,
			method: 'POST'
		})
		.done(function(msg) {
			if (msg == "1" || msg.indexOf("newid:") == 0){
				promptSuccess('提交成功!');
				
				// 隐藏侧边栏输入详细信息
				showSideBar(false);
				
				// 启用下拉菜单
				$('#menuAddTag').removeClass("disabled");
				
				// 新添加的对象, 从回应中读取ID
				var bNew = false;
				if(currentObject == undefined || currentObject == null)
				{
					currentObject = {};
					currentObject.ID = msg.replace("newid:", "");
					bNew = true;
				}
				
				// 更新字典对象
				currentObject.RealImages = dt.imgs;
				currentObject.TargetName = dt.name;
				currentObject.TargetDesc = dt.desc;
				currentObject.Lon = dt.lonlat.split(';')[0];
				currentObject.Lat = dt.lonlat.split(';')[1];
				dicAddedTag.set(currentObject.ID, currentObject);
				
				// 更新图标对象
				var feature = null;
				if(bNew){
					feature = currentAddedFeature;
				}
				else{
					feature = vectorsource.getFeatureById(currentObject.ID);
				}
				
				if(feature != null){
					feature.set('geometry', new ol.geom.Point([currentObject.Lon, currentObject.Lat]));
					feature.set('name', currentObject.TargetName);
					feature.set('objid', currentObject.ID);
					feature.set('msg', GetSummaryMsg(currentObject.TargetDesc));
					feature.setId(currentObject.ID);
				}
				currentAddedFeature = null;
			}
			else{
				promptError(msg);
			}
		})
		.fail(function(msg) {
			promptError('提交失败: ' + msg);
		});
	});
	
	// 点击删除按钮
	$('#btnDelete').hide();
	$('#btnDelete').on('click', function(){
		$('#ConfirmModal').modal();
	});
	
	$('#btnConfirmOK').on('click', function(){
		$('#ConfirmModal').modal('hide');
		
		var dt = {};
		dt.action = "deletetag";
		dt.targetid = currentObject.ID;
		
		// 提交数据
		$.ajax({
			url : C_AJAX_HANDLER_URL,
			data : dt,
			method: 'POST'
		})
		.done(function(msg) {
			if (msg == "1"){
				promptSuccess('删除成功!');
				
				// 隐藏侧边栏输入详细信息
				showSideBar(false);
				
				// 启用下拉菜单
				$('#menuAddTag').removeClass("disabled");
				
				// 删除数据
				dicAddedTag.remove(currentObject.ID);
				removeFeatureByID(currentObject.ID);
			}
			else{
				promptError(msg);
			}
		})
		.fail(function(msg) {
			promptError('删除失败: ' + msg);
		});
	});

	// ESC
	$(document).keypress(function (e) {
		if (e.keyCode === 27) {
			$("#btnCancel").click();
			$("#popup").popover('dispose');
		};  
	}); 
}

// 根据ID删除标注
function removeFeatureByID(ObjectID){
	var feature = vectorsource.getFeatureById(ObjectID);
	if (feature != null){
		vectorsource.removeFeature(feature);
	}
}

// 界面验证
function validMask(){
	var bRet = false;
	try{
		var tmp = $.trim($("#iptName").val());
		$("#iptName").val(tmp);
		if (tmp.length <= 0){
			promptError('名称不允许为空!');
			$("#iptName").focus();
			return bRet;
		}
		
		tmp = $.trim($("#iptDesc").val());
		if (tmp.length > 200)
		{
			$("#iptDesc").val(tmp.substr(0, 200));
			promptError('描述将被截取到200个字, 点击保存继续提交!');
			return bRet;
		}
		
		tmp = $.trim($("#iptLonLat").val());
		$("#iptLonLat").val(tmp);
		if (tmp.length <= 0){
			promptError('经纬度不允许为空!');
			$("#iptLonLat").focus();
			return bRet;
		}
		else{
			var pos = tmp.indexOf(';');
			if (pos == -1 || pos == 0 || pos == tmp.length){
				promptError('经纬度格式不正确!');
				$("#iptLonLat").focus();
				return bRet;
			}
		}

		bRet = true;
	}
	catch(e){
		promptError(e);
	}
	return bRet;
}

// 切换侧边栏的隐藏显示状态
function showSideBar(bShow){
	$("#iptName").val('');
	$("#iptDesc").val('');
	$("#iptLonLat").val('');
	dicUploadFiles.clear();
	$('#btnDelete').hide();
	if (bShow){
		$("body").addClass('control-sidebar-slide-open');
		$("#iptName").focus();
	}
	else {
		$("body").removeClass('control-sidebar-slide-open');
		currentAddedFeature = null;
	}
}

function OnAddTag() {
	// 禁用下拉菜单
	$('#menuAddTag').addClass("disabled");
	
	var draw = new ol.interaction.Draw({
		source: vector.getSource(),
		type: 'Point',
		style: new ol.style.Style({
			image: new ol.style.Icon({
				src: C_TAG_IMAGE, scale: 0.5, anchor: [0.5, 1] 
			}),
			zIndex: 100000 
		})
	});
	map.addInteraction(draw);
	
	draw.on('drawend',function(e){
		// 保存下feature对象
		currentAddedFeature = e.feature;
		
		// 清除交互对象
		clearAllMapInteraction(7);

		// 设置默认图片上传对象
		ResetFileInput(null, null);
		
		// 打开侧边栏输入详细信息
		showSideBar(true);
		
		// 传入坐标信息
		$("#iptLonLat").val(e.target.a[0].toFixed(8) + ';' + e.target.a[1].toFixed(8));
	}, this);
}

// 重置文件上传控件
function ResetFileInput(szImageNames, objectID){
	$('#selectImages').html('<input type="file" name="iptImage" id="iptImage" multiple class="file-loading"/>');
	if (szImageNames != null && objectID != null){
		// 带数据库预览图片的fileinput对象
		$('#iptImage').fileinput({
			theme: "fa",	// 设置图标库
			language: 'zh', //设置语言
			uploadUrl: C_FILE_HANDLER_URL, //上传的地址
			allowedFileExtensions: ['jpg', 'gif', 'png'],//接收的文件后缀
			showUpload: true, //是否显示上传按钮
			showCaption: false,//是否显示标题
			browseClass: "btn btn-primary", //按钮样式
			maxFileCount: 10, //表示允许同时上传的最大文件个数
			enctype: 'multipart/form-data',
			validateInitialCount:true,
			previewFileIcon: "<i class='fa fa-star-o'></i>",
			msgFilesTooMany: "选择上传的文件数量({n}) 超过允许的最大数值{m}！",
			overwriteInitial: false,
			initialPreviewAsData: true,
			initialPreview: GetImagesUrl(szImageNames),
			initialPreviewConfig: GetImagesPreviewConfig(szImageNames, objectID)
		});
	}
	else{
		// 空的fileinput对象
		$('#iptImage').fileinput({
			theme: "fa",	// 设置图标库
			language: 'zh', //设置语言
			uploadUrl: C_FILE_HANDLER_URL, //上传的地址
			allowedFileExtensions: ['jpg', 'gif', 'png'],//接收的文件后缀
			showUpload: true, //是否显示上传按钮
			showCaption: false,//是否显示标题
			browseClass: "btn btn-primary", //按钮样式
			maxFileCount: 10, //表示允许同时上传的最大文件个数
			enctype: 'multipart/form-data',
			validateInitialCount:true,
			previewFileIcon: "<i class='fa fa-star-o'></i>",
			msgFilesTooMany: "选择上传的文件数量({n}) 超过允许的最大数值{m}！"
		});
	}
	
	//导入文件上传完成之后的事件
	$("#iptImage").on("fileuploaded", function (e, data, previewId, index) {
		var msg = data.response.msg;
		if (msg == 'success'){
			var orgFileName = e.target.files[index].name;
			promptSuccess('上传成功: ' + orgFileName);
			if (dicUploadFiles.has(orgFileName))
				dicUploadFiles.remove(dicUploadFiles);
			dicUploadFiles.set(orgFileName, data.response.filename);
		}
		else
			promptError(msg);
	}).on('fileclear', function(e, data, previewId, index){
		// 清空所有未上传的文件
		dicUploadFiles.clear();
	}).on('filepreremove', function(e, data, previewId, index){
		// 删除未上传的文件
		var orgFileName = e.target.files[0].name;
		dicUploadFiles.remove(orgFileName);
	}).on('filedeleted', function(e, objid, previewId, param){
		// 删除已经上传的文件
		if (dicAddedTag.has(objid)){
			var targetObj = dicAddedTag.get(objid);
			targetObj.RealImages += ";";
			targetObj.RealImages = targetObj.RealImages.replace(param.name + ";", "");
			if (targetObj.RealImages.length > 0){
				targetObj.RealImages = targetObj.RealImages.substring(0, targetObj.RealImages.length - 1);
			}
			dicAddedTag.set(objid, targetObj);
		}
	});
}

var clearAllMapInteraction = function(idx){
	var interactions = map.getInteractions();
	var length = interactions.getLength();
	for(var i = idx; i<length; i++){
		var interaction = interactions.item(idx);
		if(interaction instanceof ol.interaction.Select){
			interaction.getFeatures().clear()
		}
		map.removeInteraction(interaction)
	}
};

function getTdtLayer(t) {
    let url = 'http://t0.tianditu.com/DataServer?T=' + t + '&X={x}&Y={y}&L={z}'
    let projection = ol.proj.get(C_PROJECTION)
    let projectionExtent = [-180, -90, 180, 90]
    let maxResolution = (ol.extent.getWidth(projectionExtent) / (256 * 2))
    let resolutions = new Array(16)
    for (let z = 0; z < 16; ++z) {
        resolutions[z] = maxResolution / Math.pow(2, z)
    }
    var tileOrigin = ol.extent.getTopLeft(projectionExtent)
    var layer = new ol.layer.Tile({
        extent: [-180, -90, 180, 90],
        source: new ol.source.TileImage({
            tileUrlFunction: function (tileCoord) {
                var z = tileCoord[0] + 1
                var x = tileCoord[1]
                var y = -tileCoord[2] - 1
                var n = Math.pow(2, z + 1)
                x = x % n
                if (x * n < 0) {
                    x = x + n
                }
                return url.replace('{z}', z.toString())
                    .replace('{y}', y.toString())
                    .replace('{x}', x.toString())
            },
            projection: projection,
            tileGrid: new ol.tilegrid.TileGrid({
                origin: tileOrigin,
                resolutions: resolutions,
                tileSize: 256
            })
        })
    })
    return layer
}

// 弹出错误提示
function promptError(s){
	toastr.error(s);
}

// 弹出成功提示
function promptSuccess(s){
	toastr.success(s);
}