/**
 * Called on POST at /content/upload
 */

var uuid = require('node-uuid'),
	path = require('path');

module.exports = {

	uploadFiles: function(req, res) {

		var originalFileName = "";

		var results = [],
			streamOptions = {
				dirname: sails.config.appPath + "/uploads/tmp/",
				saveAs: function(file) {
					originalFileName = file.filename;
					var filename = file.filename,
						newName = req.user[0].id + "_" + uuid.v4() + path.extname(filename); // New file name generation
					return newName;
				},
				completed: function(fileData, next) {

					CubeFaceContentFile.create({
						owner: req.user[0],
						cube: req.param('cube'),
						face: req.param('face'),
						localName: fileData.localName,
						contentType: fileData.type,
						originalName: originalFileName
					}).exec(function(err, contentFile) {

						if (!err) {

							// res.json(contentFile);
							// If all is good, move file to s3

							var s3 = require('s3');
							var fs = require('fs');
							var client = s3.createClient({
								s3Options: {
									accessKeyId: "",
									secretAccessKey: "",
									region: 'ap-southeast-2'
								},
							});
							var params = {
								localFile: sails.config.appPath + "/uploads/tmp/" + contentFile.localName,

								s3Params: {
									Bucket: "",
									Key: "",
									ACL: "public-read",
								},
							};
							var uploader = client.uploadFile(params);
							uploader.on('error', function(err) {
								// console.error("unable to upload:", err.stack, err);
							});
							uploader.on('progress', function() {
								// console.log("progress", uploader.progressMd5Amount, uploader.progressAmount, uploader.progressTotal);
							});
							uploader.on('end', function() {
								// console.log("done uploading");

								// Delete local copy of file
								fs.unlinkSync(sails.config.appPath + "/uploads/tmp/" + contentFile.localName);

								// Returns file details
								res.json({
									localName: contentFile.localName,
									url: 'http://cdn.newscube.io/userdata/'
								});

							});

						}

					});
				}
			};

		// Upload POSTed files to local & s3
		req.file('file').upload(Uploader.documentReceiverStream(streamOptions),
			function(err, files) {
				if (err) return res.serverError(err);

				// After S3, it never runs this. Backup in case something goes wrong before...
				res.json({
					message: files.length + ' file(s) uploaded successfully!',
					files: results
				});

			}
		);

	},

};