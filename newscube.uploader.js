'use strict';

newscube
	.controller('UploaderCtrl', ['$scope', '$http', '$timeout', '$upload', 'ContentCreationService',
		function($scope, $http, $timeout, $upload, ContentCreationService) {

			$scope.uploadedStuff = [];
			$scope.selectedFile = {};
			$scope.media = {};
			$scope.uploadError = "";

			var ps = $scope.$parent;
			var mediaTypes = {
				'document': {
					type: 'document',
					filetypes: '.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .keynote, .pages, .numbers, .zip',
					filemaxsize: '25 MB',
					filemaxsizeb: 25000000,
					filters: 'application/',
					pass: 2
				},
				'image': {
					type: 'image',
					filetypes: '.jpg, .png, .gif',
					filemaxsize: '7 MB',
					filemaxsizeb: 7000000,
					filters: 'image/',
					pass: 2
				},
				'video': {
					type: 'video',
					filetypes: '.mov, .mp4, .mp3, .mpg',
					filemaxsize: '50 MB',
					filemaxsizeb: 50000000,
					filters: 'video/',
					pass: 2
				},
				'audio': {
					type: 'audio',
					filetypes: '.mp3',
					filemaxsize: '25 MB',
					filemaxsizeb: 25000000,
					filters: 'audio/',
					pass: 2
				}
			};


			$scope.media = mediaTypes[ps.contentType];

			// Checks uploaded file
			var fileCheck = function(f) {
				var p = 0;
				console.log(f);

				// File type
				var atypes = $scope.media.filetypes.replace(/\ /g, '').replace(/\./g, $scope.media.filters).split(",");
				if (atypes.indexOf(f.type) > -1) p++;
				if (p == 0) {
					var atypes = $scope.media.filetypes.replace(/\,\ \./g, '|').replace(/\./g, '');
					var re = RegExp(atypes, "g");
					if (f.name.match(re)) p++;
				}

				// File size
				if ($scope.media.filemaxsizeb >= f.size) p++;

				return p == $scope.media.pass;
			}

			$scope.pickFile = function($files) {

				var file = $files[0];

				var uploadData = {};

				if (ContentCreationService.c()) {
					uploadData = ContentCreationService.c();
					if (uploadData.cube) uploadData.cube = uploadData.cube.id;
					if (uploadData.face) uploadData.face = uploadData.face.id;
				} else {
					if (ps.uploadData) uploadData = ps.uploadData;
					if (uploadData.cube) uploadData.cube = uploadData.cube.id;
					if (uploadData.face) uploadData.face = uploadData.face.id;
				}

				// console.log(uploadData);

				if (!fileCheck(file)) {
					return $scope.uploadError = "Please, verify selected file and try again.";
				}

				if (file) {
					$scope.uploadError = "";

					// Upload
					$scope.upload = $upload.upload({
						url: '/content/upload',
						data: uploadData,
						file: file,
						filters: ['imageTypeFilter']
					})
						.progress(function(evt) {
							$scope.isUploading = true;
							$scope.uploadPercent = parseInt(100.0 * evt.loaded / evt.total) + "%";
							if ($scope.uploadPercent == "100%") $scope.uploadPercent = "Processing...";
						})
						.success(function(data, status, headers, config) {

							$scope.uploadPercent = "Processing...";

							$timeout(function() {
								$scope.$apply(function() {

									$scope.isUploading = false;
									$scope.uploadedStuff.push(data);

									if (ps.onUploadComplete) {
										ps.onUploadComplete(data);
									}

									$scope.selectedFile = data;
									if ($scope.$parent.onSelectUpload)
										$scope.$parent.onSelectUpload(data);

								});
							}, 5000);

						});
				}
			};

			// Get uploaded file preview (if available)
			$scope.getPreview = function(f) {
				if ($scope.media.type == "image")
					return f.url + f.localName;
				else
					return "";
			}

			// Select uploaded file (from uploaded files)
			$scope.selectUploaded = function(f) {
				$scope.selectedFile = f;
				$scope.$parent.selectedUpload = f;
				if ($scope.$parent.onSelectUpload)
					$scope.$parent.onSelectUpload(f);
			}

			// Called when click on upload box
			$scope.uploadNavigate = function() {
				var evt = document.createEvent("MouseEvents");
				evt.initEvent("click", true, false);
				document.getElementById("filePicker").dispatchEvent(evt);
			}

		}
	])