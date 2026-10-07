<?php
/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/trp-solutions/PointPhoto/blob/main/LICENSE
*/
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>PointPhoto sample</title>
	<meta charset="utf-8">
	<script src="../lib/PointPhoto.js"></script>
	<script src="../lib/PointPhotoImage.js"></script>
	<style>
		.container {
			padding: 1rem;
			margin-bottom: 1rem;
			border: 1px solid black;
			width: max-content;
		}

		.pointphoto-image {
			max-width: min(20rem, 100vw - 4rem);
		}
	</style>
</head>
<body onload="PointPhotoImage.init({album:'.pointphoto-image', camera:document.querySelector('#camera')});">
	<?php
	if(!empty($_FILES)){
		foreach($_FILES as $name => $file){
			if($file['size'] == 0){
				continue;
			}
			echo <<<HTML
			<p>
				Input name: $name<br>
				Uploaded file: $file[name]<br>
				Type: $file[type]<br>
				Size: $file[size]
			</p>
			HTML;
		}
	}
	?>
	<div id="camera"></div>
	<form enctype="multipart/form-data" method="post" action="." onsubmit="if(PointPhotoImage.album.some(image=>image.warn_required())){event.preventDefault();}">
		<div class="container">
			<label>image1</label>
			<div class="pointphoto-image" data-pointphoto-name="image1" data-pointphoto-preset="preset.svg"></div>
		</div>
		<div class="container">
			<label>image2</label>
			<div class="pointphoto-image" data-pointphoto-name="image2" data-pointphoto-overlay="overlay.svg" data-pointphoto-required></div>
		</div>
		<div class="container">
			<label>image3</label>
			<div class="pointphoto-image" data-pointphoto-name="image3"></div>
		</div>
		<input type="submit">
	</form>
</body>
</html>
