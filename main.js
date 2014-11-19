;
(function(window, undefined) {



	var cubeObjTmp = {	// 顯示圖片物件
		number: 0,
		pos: 0,
		isActive: false,
		originPos: 0,
		dom: null,
		aDom: null,
		imgDom: null
	};


	var switchImgTag = function(imgPath, tag, newTag) {

		var imgPathWithoutTag = imgPath.substr(0, imgPath.lastIndexOf(tag));
        var lastIndex = imgPath.lastIndexOf('.');
        var substr = imgPath.substr(0, lastIndex);
        var begin = imgPath.length - lastIndex;
        var ext = imgPath.substr(-begin, begin);

        return imgPathWithoutTag + newTag + ext;
	};


	// 預載還沒顯示的商品圖
    var imgPreload = function($container) {

    	var $imgs = $container.find('img');
    	var imgs = [];


    	$.each($imgs, function() {
    		
    		var src = $(this).attr('src');

    		if (src) {

    			if (src.lastIndexOf('_a') !== -1) {
    				imgs.push(switchImgTag(src, '_a', '_b'));
    			}
    			else {
    				imgs.push(switchImgTag(src, '_b', '_a'));
    			}
    		}
    	});

        var i = 0;
        var image = new Image();
        image.onerror = image.onload = function() {
            setTimeout(function() {
                return ++i, i >= imgs.length ? (image.onload = null, image.onerror = null, image = null, void(i = null)) : void(image.src = imgs[i]);
            }, 1);
        }, image.src = imgs[i];
    };

	// 計算整個container的寬高並調整container的寬高
	var calculateContainer = function($container, margin, widthAndHeight) {
		containerHeight = widthAndHeight * 2 + margin * 3;
		containerWidth = widthAndHeight * 4 + margin * 5;

		$container.height(containerHeight);
		$container.width(containerWidth);

		return {
			conHeight: containerHeight,
			conWidth: containerWidth,
			margin: margin,
			cubeSize: widthAndHeight,
			cubeSizeBig: widthAndHeight * 2 + margin
		};
	};

	// 計算八個方格的x,y坐標位置
	var calculatePos = function(globalData) {

		var posObj = {}; // 所有位置的左上角x.y坐標
		var i, len;
		var margin = globalData.margin;
		var plus = margin + globalData.cubeSize;
		var left = 0;
		var top = 0;

		for (i = 1; i <= 8; i += 1) {

			if (i % 4 === 1) {

				left = margin;

				if (i === 1) {
					top = margin;
				}
				else {
					top = plus + margin;
				}
			}
			else {
			
				if (i < 5) {
					top = margin;
					left = plus * (i - 1) + margin;
				}
				else {
					top = plus + margin;
					left = plus * (i - 5) + margin;
				}
			}
			posObj[i] = {
				left: left,
				top: top
			};
		}
		return posObj;
	};

	// 修改並調整每個cube的大小與位置, 並產生對應的物件
	var modifyCubeSizeAndPos = function($container, posObj, globalData) {
		
		var $cubes = $container.find('.cube');
		var cubesObj = {};
		var cubeSize = globalData.cubeSize;
		var cubeSizeBig = globalData.cubeSizeBig;
		//var posAry = [false, false, false, false, false, false, false, false]; // 是否已被用走陣列


		$.each($cubes, function(index, value) {

			var $target = $(this);
			var $a = $target.find('a');
			var $img = $target.find('img');
			var number = $target.attr('data-number');
			var pos = $target.attr('data-pos');
			var isActive = $target.hasClass('active');
			var size = cubeSize;

			if (isActive) {
				size = cubeSizeBig;
			}
			$target.css({
				'width': size,
				'height': size,
				'top': posObj[pos].top,
				'left': posObj[pos].left
			});

			$img.css({
				'width': size,
				'height': size,
			});

			var cubeObj = $.extend({}, cubeObjTmp, {
				number: +number,
				dom: $target,
				imgDom: $img,
				aDom: $a,
				isActive: isActive,
				pos: +pos,
				originPos: +pos
			});
			cubesObj[number] = cubeObj;
		});
		return cubesObj;
	};


	var eventInit = function($container, posObj, cubesObj, globalData) {

		var $cubes = $container.find('.cube');
		var cubeSize = globalData.cubeSize;
		var cubeSizeBig = globalData.cubeSizeBig;

		var getScalePos =  function(pos) { // 當cube放大時，所需佔位的空間

			var scalePos = [];

			switch (+pos) {
				case 1:
				case 5:
					scalePos = [1, 2, 5, 6];
					break;
				case 2:
				case 3:
				case 6:
				case 7:
					scalePos = [2, 3, 6, 7];
					break;
				case 4:
				case 8:
					scalePos = [3, 4, 7, 8];
					break;
			}
			return scalePos;
		};

		

		var clickEvent = (function () {


			var clickFunc = (function() {

				// 模擬href與_blank
				var goHref = function(aDom) {

					var href = aDom.attr('href');
					var target = aDom.attr('target');

					if (href && href !== '#') {

						if (target === '_blank') {
							window.open(href, 'blank');
							return false;
						}
						location.href = href;
					}
				};
				return function($target, clickEvent) {

					var number = $target.attr('data-number');
					var activeNumber = $container.find('.active').attr('data-number');
					var cube = cubesObj[number];
					var activeCube = cubesObj[activeNumber];

					if (cube.isActive) {
						clickEvent();
						goHref(cube.aDom);
						return false;
					}
					calculateNewPos(cube, activeCube);
				};
			})();

			return function() {
				$cubes.on('click', function(e) {
					$cubes.off('click').on('click', function(e) {
						e.preventDefault();
					});
					e.preventDefault();
					clickFunc($(this), clickEvent);
				});
			};
		})();


		var calculateNewPos = (function() {

			// 將class與css更新, 點選的z-index為最高, 並加上active class
			var updateActive = function(cube) {
				$.each(cubesObj, function(index, value) {
					cubesObj[index].isActive = false;
					cubesObj[index].dom.removeClass('active')
									   .css('z-index', 100);
				});
				cubesObj[cube.number].isActive = true;

				cube.dom.css({
					'z-index': 1000
				});
				cube.dom.addClass('active');
			};

			var getCubesByPos = (function() {

				var cubesObjByPosTmp = {
					1: null, 
					2: null,
					3: null,
					4: null,
					5: null,
					6: null,
					7: null,
					8: null
				};
				var cubesObjByPos = null;

				return function(cubesObj) {
					cubesObjByPos = $.extend({}, cubesObjByPosTmp);

					$.each(cubesObj, function(index, value) {
						cubesObjByPos[this.pos] = this;
					});
					return cubesObjByPos;
				};
			})();

			// 取得要移動的物件陣列
			var getMoveObjAry = function(cube, scalePos, cubesObjByPos) {

				var moveObjAry = [];

				// 取得需要移動的cube
				$.each(scalePos, function(index, value) {

					var obj = cubesObjByPos[value];

					if (obj && obj.number !== cube.number) {
						moveObjAry.push(obj);
					}
				});
				return moveObjAry;
			};


	

			// 方塊位移動化
			var showMoveAnimation = function(moveObjAry, callback) {

			    async.each(moveObjAry, function(cube, callbackEach) {

			    	var posData = posObj[cube.pos];

			    	cube.dom.animate({
						left: posData.left,
						top: posData.top
					}, 333, function() {
						callbackEach();
					});

				}, function(err){

				    if (err) {
				      console.log('async each error');
				    } 
				    else {
				     	callback(null);
				    }
				});
			};

			var showZoomOutAnimation = (function() {

				return function(cube, oldActiveCubePos, callback) {

					var pos = posObj[oldActiveCubePos];
					var src = cube.imgDom.attr('src');
					src = switchImgTag(src, '_a', '_b');

					async.parallel([
					    function(callbackPara) {

					    	cube.imgDom.animate({
								left: pos.left,
								top: pos.top,
								width: cubeSize,
								height: cubeSize
							}, 333, function() {
								callbackPara(null);
							});
					    },
					    function(callbackPara){
					  
					       	cube.dom.animate({
								left: pos.left,
								top: pos.top,
								width: cubeSize,
								height: cubeSize
							}, 333, function() {

								callbackPara(null);
							});
					    }
					],
					function(err, results) {
						cube.imgDom.attr('src', src);
					    callback(null);
					});
				};
			})();



			var showZoomInAnimation = (function() {

				var getZoomInDirection = function(pos) {

					var direction = null;

					switch (+pos) {

						case 1:
						case 2:
							direction = {
								top: 0,
								left: 0
							};
							break;
						case 3:
						case 4:
							direction = {
								top: 0,
								left: -1
							};
							break;
						case 5:
						case 6:
							direction = {
								top: -1,
								left: 0
							};
							break;
						case 7:
						case 8:
							direction = {
								top: -1,
								left: -1
							};
							break;
					}

					return direction;
				};
				return function(cube, callback) {

					var direction = getZoomInDirection(cube.pos);
					var movePos = +cube.pos;

					movePos = movePos + direction.top * 4 + direction.left;

					var pos = posObj[movePos];
					var src = cube.imgDom.attr('src');
					src = switchImgTag(src, '_b', '_a');

					async.parallel([
					    function(callbackPara) {
					    	cube.imgDom.attr('src', src);
					    	cube.imgDom.animate({
								left: pos.left,
								top: pos.top,
								width: cubeSizeBig,
								height: cubeSizeBig
							}, 333, function() {
								callbackPara(null);
							});
					    },
					    function(callbackPara){
					  
					       	cube.dom.animate({
								left: pos.left,
								top: pos.top,
								width: cubeSizeBig,
								height: cubeSizeBig
							}, 333, function() {

								callbackPara(null);
							});
					    }
					],
					function(err, results) {
						
					    callback(null, 'done');
					});
				};
			})();


			return function(cube, activeCube) {

				var oldActiveCubePos = activeCube.pos;
				var moveObjAry = [];
				var scalePos = getScalePos(cube.pos); // 取得放大所需的位子陣列
				var cubesObjByPos = getCubesByPos(cubesObj); // 取得用位置當key的cube物件hash
				var moveObjAry = getMoveObjAry(cube, scalePos, cubesObjByPos); // 計算新的位置
			

				// 計算要移動的cube要移到哪個位置
				$.each(moveObjAry, function(index, value) {

					var moveCube = value;
					moveObjAry[index] = null;

					$.each(cubesObjByPos, function(index2, value2) {

						//console.log(cubesObjByPos[index2]);

						//console.log($.inArray(+index2, scalePos));
						
						if ($.inArray(+index2, scalePos) === -1 && !cubesObjByPos[index2]) {

							//console.log(index2);
						
							cubesObjByPos[moveCube.pos] = null;
							moveCube.pos = index2;
							cubesObjByPos[index2] = moveCube;

							moveObjAry[index] = moveCube;
							cubesObj[value.number] = moveCube;
						}
					});
				});

				// 更新Active狀況
				updateActive(cube);

				// 移動動畫開始
				async.waterfall([
				    function(callback) {
				    	showZoomOutAnimation(activeCube, oldActiveCubePos, callback);
				    },
				    function(callback) {
						showMoveAnimation(moveObjAry, callback);
				    },
				    function(callback) {
				    	showZoomInAnimation(cube, callback); 
				    }
				], function (err, result) {
					clickEvent();
				});
			};
		})();
		clickEvent();
	};


	// 計算contanier與區塊大小，總共八塊
	var init = function($container, margin, widthAndHeight) {

		imgPreload($container);
		var globalData = calculateContainer($container, margin, widthAndHeight);
		var posObj = calculatePos(globalData);
		var cubesObj = modifyCubeSizeAndPos($container, posObj, globalData);
		eventInit($container, posObj, cubesObj, globalData);
	};


	$(function() {
		init($('#container'), 5, 210);
		init($('#container2'), 10, 100);
	});

})(window, undefined);