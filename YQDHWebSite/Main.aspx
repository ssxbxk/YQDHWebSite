<%@ Page Language="C#" AutoEventWireup="true" CodeFile="Main.aspx.cs" Inherits="Main" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="x-ua-compatible" content="ie=edge">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>后台管理系统</title>
	<!-- Font Awesome Icons -->
	<link rel="stylesheet" href="plugins/font-awesome/css/font-awesome.min.css">
	<!-- Theme style -->
	<link rel="stylesheet" href="plugins/adminlte/css/adminlte.min.css">
	<!-- OpenLayers -->
	<link rel="stylesheet" href="plugins/openlayers/ol.css" type="text/css">
	<!-- toastr alert -->
	<link rel="stylesheet" href="plugins/toastr/toastr.min.css" type="text/css">
	<!-- bootstrap-fileinput -->
	<link rel="stylesheet" href="plugins/bootstrap-fileinput/css/fileinput.min.css" type="text/css">
	<link rel="stylesheet" href="css/customui.css">
</head>
<body class="hold-transition sidebar-mini">
	<div class="wrapper">
		<!-- Navbar -->
		<nav class="main-header navbar navbar-expand bg-white navbar-light border-bottom">
			<!-- Right navbar links -->
			<ul class="navbar-nav ml-auto">
				<!-- Messages Dropdown Menu -->
				<li class="nav-item dropdown">
					<a class="nav-link" data-toggle="dropdown" href="#" id="menuAddTag" title="添加标注点">
						<i class="fa fa-map-signs fa-lg" style="color:green;"></i>
					</a>
					<div class="dropdown-menu dropdown-menu-right">
						<a href="#" id="addtag" class="dropdown-item"><i class="fa fa-star-o"></i> 添加标注点</a>
					</div>
				</li>
			</ul>
		</nav>
		<!-- /.navbar -->
		<!-- Main content -->
		<div class="content">
			<div class="container-fluid">
				<div id="map" class="map"><div id="popup"></div></div>
			</div><!-- /.container-fluid -->
		</div>
		<!-- /.content -->
	</div>
	
	<!-- Control Sidebar -->
	<aside class="control-sidebar control-sidebar-light">
		<!-- Control sidebar content goes here -->
		<div class="p-3">
			<h5 class="pt"><strong>标注点</strong></h5>
			<div class="dropdown-divider"></div>
			<div class="form-group">
				<label for="iptName">名称<i class="fa fa-star fa-min" style="color:red"></i></label>
				<input type="text" class="form-control" id="iptName" placeholder="请输入标注点名称" maxLength="50"/>
			</div>
			<div class="form-group">
				<label for="iptDesc">描述</label>
				<textarea class="form-control" id="iptDesc" placeholder="请输入标注点描述" rows="10"></textarea>
			</div>
			<div class="form-group">
				<label for="iptLonLat">经纬度<i class="fa fa-star fa-min" style="color:red"></i></label>
				<input type="text" class="form-control" id="iptLonLat" placeholder="请输入标注点经纬度" maxLength="22"/>
			</div>
			<button class="btn btn-primary btn-sm" id="btnAddImage" data-toggle="modal" data-target="#AddImageModal">照片</button>
			<button type="submit" class="btn btn-primary btn-sm" id="btnSave">保存</button>
			<button class="btn btn-danger btn-sm" id="btnDelete">删除</button>
			<button class="btn btn-default btn-sm" id="btnCancel">取消</button>
		</div>
	</aside>
	<!-- /.control-sidebar -->

	<!-- 添加照片模态框（Modal） -->
	<div class="modal fade" id="AddImageModal" tabindex="-1" role="dialog" >
		<div class="modal-dialog" role="document">
			<div class="modal-content r300" style="width:1100px;">
				<div class="modal-header">
					<h4 class="modal-title" id="myModalLabel">照片</h4>
					<button type="button" class="close" data-dismiss="modal">&times;</button>
				</div>
				<div class="modal-body">
					<div id="selectImages" class="ztree" style="height:600px;overflow:auto;"></div>
				</div>
			</div><!-- /.modal-content -->
		</div><!-- /.modal -->
	</div>
	<!-- /添加照片模态框（Modal） -->
	
	<!-- 初始化模态框（Modal） -->
	<div class="modal fade text-center" id="LoadingModal" tabindex="-1" role="dialog" >
		<div class="container">  
			<div class="row row-centered">  
				<image src="icon/loading.gif" onclick="OnHide()"/>
			</div>
		</div>
	</div>
	<!-- /初始化模态框（Modal） -->
	
	<!-- 确认模态框（Modal） -->
	<div class="modal fade" id="ConfirmModal" tabindex="-1" role="dialog" >
		<div class="modal-dialog" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title" id="ConfirmModalLabel">确认</h4>
					<button type="button" class="close" data-dismiss="modal">&times;</button>
				</div>
				<div class="modal-body">
					<label>请确认是否删除该标记?</label>
				</div>
				<div class="modal-footer">
					<button class="btn btn-primary btn-sm" id="btnConfirmOK">确定</button>
					<button class="btn btn-default btn-sm" data-dismiss="modal">取消</button>
				</div>
			</div><!-- /.modal-content -->
		</div><!-- /.modal -->
	</div>
	<!-- /确认模态框（Modal） -->
	
	<!-- jQuery -->
	<script src="plugins/jquery/jquery.min.js"></script>
	<!-- Bootstrap 4 -->
	<script src="plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
	<!-- AdminLTE App -->
	<script src="plugins/adminlte/js/adminlte.min.js"></script>
	<!-- OpenLayers -->
	<script src="plugins/openlayers/ol.js"></script>
	<!-- toastr alert -->
	<script src="plugins/toastr/toastr.min.js"></script>
	<!-- bootstrap-fileinput -->
	<script src="plugins/bootstrap-fileinput/js/fileinput.min.js"></script>
	<script src="plugins/bootstrap-fileinput/js/locales/zh.js"></script>
	<script src="plugins/bootstrap-fileinput/themes/fa/theme.min.js"></script>
	<script src="js/Dictionary.js"></script>
	<script src="js/FileInput.js"></script>
	<script src="js/MainPage.js"></script>
</body>
</html>
