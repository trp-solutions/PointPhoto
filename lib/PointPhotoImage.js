/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/trp-solutions/PointPhoto/blob/main/LICENSE
*/
"use strict";

function PointPhotoImage(container, options){
	options = options || {};
	var input_name = options.name || container.dataset.pointphotoName || 'pointphoto[]';
	var preset = options.preset || container.dataset.pointphotoPreset || '';
	var preview_url = preset || options.default_preview || container.dataset.pointphotoDefaultPreview || '';

	var internal = {
		container: container,
		file_url: undefined,
		file_input: create_file_input(input_name, set_file_object),
		preview: document.createElement('img'),
		clear_button: PointPhotoImage.create_button('clear', ()=>this.clear(), 'danger', true),
		warning: PointPhotoImage.create_warning(),
		default_state: preset ? 'preset' : 'empty',
		default_preview_url: preview_url,
		default_camera: options.camera || false
	};

	var buttons = document.createElement('div');
	buttons.classList.add('pointphoto-buttons');
	if(internal.default_camera){
		buttons.append(PointPhotoImage.create_button('camera', ()=>this.use_camera()));
	}
	buttons.append(
		PointPhotoImage.create_button('upload', ()=>this.use_local()),
		internal.clear_button
	);

	internal.warning.style.display = 'none';
	internal.preview.src = internal.default_preview_url;
	internal.container.dataset.pointphotoState = internal.default_state;
	internal.container.style.display = 'flex';
	internal.container.style['flex-direction'] = 'column';
	internal.container.replaceChildren(
		internal.file_input,
		internal.preview,
		buttons,
		internal.warning,
	);

	function create_file_input(name, set_file_object){
		var input = document.createElement('input');
		input.style.display = 'none';
		input.type = 'file';
		if(name){
			input.name = name;
		}
		input.addEventListener('change',()=>set_file_object(input.files[0], 'file_input'));
		return input;
	}

	function set_file_object(file, source){
		if(internal.file_url){
			URL.revokeObjectURL(internal.file_url);
		}
		if(file){
			internal.file_url = URL.createObjectURL(file);

			if(source != 'file_input'){
				var datatransfer = new DataTransfer();
				datatransfer.items.add(file);
				internal.file_input.files = datatransfer.files;
			}

			internal.preview.src = internal.file_url;
			internal.container.dataset.pointphotoState = 'image';
			internal.warning.style.display = 'none';

			internal.clear_button.disabled = false;
			internal.clear_button.style.display = '';
			var event = new Event('pointphoto-image-added');
		} else {
			internal.file_url = undefined;

			internal.preview.src = internal.default_preview_url;
			internal.container.dataset.pointphotoState = internal.default_state;

			internal.clear_button.disabled = true;
			internal.clear_button.style.display = 'none';
			event = new Event('pointphoto-image-removed');
		}
		delete internal.container.dataset.pointphotoWarning;
		internal.container.dispatchEvent(event);
	}

	this.use_camera = function(camera){
		if(!(camera instanceof PointPhoto)){
			camera = internal.default_camera;
		}
		if(camera){
			camera.open(input_name,file => set_file_object(file, 'camera'));
			event = new Event('pointphoto-image-use-camera');
			internal.container.dispatchEvent(event);
		}
	}

	this.use_local = ()=>internal.file_input.click();

	this.clear = ()=>set_file_object();

	this.warn_required = function(force_warning){
		if(
			force_warning
			|| (
				typeof internal.container.dataset.pointphotoRequired != 'undefined'
				&& internal.container.dataset.pointphotoState != 'image'
				&& internal.container.dataset.pointphotoState != 'preset'
			)
		){
			internal.warning.style.display = null;
			return true;
		} else {
			return false;
		}
	}

	this.remove_warning = function(){
		internal.warning.style.display = 'none';
	}
}

PointPhotoImage.create_button = function create_button(name, onclick, type, disabled){
	var button = document.createElement('button');
	button.classList.add('pointphoto-button');
	if(type=='danger'){
		button.classList.add('pointphoto-button-danger');
	}
	button.setAttribute('type','button');
	button.addEventListener('click',onclick);
	button.append(PointPhotoImage.create_icon(name));
	if(disabled){
		button.disabled = true;
		button.style.display = 'none';
	}
	return button;
}

PointPhotoImage.create_icon = function create_icon(name){
	var span = document.createElement('span');
	span.textContent = name;
	return span;
}

PointPhotoImage.create_warning = function create_warning(){
	var div = document.createElement('div');
	div.classList.add('pointphoto-warning');
	div.replaceChildren(PointPhotoImage.create_icon('warning'));
	return div;
}

PointPhotoImage.init = function init(options){
	options = options || {};
	if(options.camera instanceof PointPhoto){
		this.camera = PointPhoto;
	} else if(options.camera instanceof Element){
		this.camera = options.camera.PointPhotoInstance || new PointPhoto(options.camera, options);
	}

	if(typeof options.album == 'string'){
		var album_images = document.querySelectorAll(options.album);
	} else if(typeof options.album == 'object' && typeof options.album.forEach == 'function'){
		album_images = options.album;
	}
	if(album_images){
		var picture_options = {};
		if(options.camera !== false && this.camera){
			picture_options.camera = this.camera;
		}
		if(!this.album){
			this.album = [];
		}
		album_images.forEach(image => {
			if(!image.PointPhotoImageInstance){
				var instance = new PointPhotoImage(image, picture_options);
				image.PointPhotoImageInstance = instance;
				this.album.push(instance);
			}
		})
	}
}
