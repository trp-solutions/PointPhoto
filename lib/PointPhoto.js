/*
PointPhoto is licensed under the Apache License 2.0 license
https://github.com/trp-solutions/PointPhoto/blob/main/LICENSE
*/
"use strict";

function PointPhoto(container, options){
	var internal = init(this, container, options||{});

	function init(instance, container, options){
		var video = create_video();
		var canvas = document.createElement('canvas');
		var context2d = canvas.getContext('2d');

		var loading = typeof PointPhoto.create_camera_loading == 'function' ? PointPhoto.create_camera_loading() : null;

		var viewer = create_element('div',{'display':'flex'},loading, video);

		var li_style = {'pointer-events':'auto'};
		var controls = create_element(
			'menu',
			{
				'display': 'flex',
				'justify-content': 'center',
				'align-items': 'end',
				'position': 'absolute',
				'top': '0px',
				'bottom': '0px',
				'left': '0px',
				'right': '0px',
				'z-index': '1',
				'pointer-events': 'none',
				'list-style': 'none',
			},
			create_element('li',li_style,PointPhoto.create_button('snapshot', ()=>instance.snapshot())),
			create_element('li',li_style,PointPhoto.create_button('swap_camera', ()=>instance.swap_camera())),
			create_element('li',li_style,PointPhoto.create_button('close', ()=>instance.close(), 'danger')),
		);

		container.style.display = 'none';
		container.style.position = 'relative';
		container.PointPhotoInstance = instance;
		container.replaceChildren(viewer, controls);

		return {
			container: container,
			file_name: undefined,
			file_callback: undefined,
			file_object: undefined,
			loading: loading,
			video: video,
			controls: controls,
			canvas: canvas,
			canvas_context2d: context2d,
			facing_mode: options.facing=='user' ? 'user' : 'environment',
			orientation_mode: options.orientation || 'landscape',
		}
	}

	function set_state(state){
		if(internal.loading){
			internal.loading.style.display = state == 'loading' ? null : 'none';
		}
		internal.video.style.display = state == 'active' ? null : 'none';
		internal.controls.style.display = state == 'active' ? 'flex' : 'none';
		internal.container.style.display = state == 'inactive' ? 'none' : null;
	}

	function is_rotated(){
		return (
			internal.orientation_mode == 'landscape'
			&& internal.video.videoWidth < internal.video.videoHeight
		) || (
			internal.orientation_mode == 'portrait'
			&& internal.video.videoWidth > internal.video.videoHeight
		);
	}

	function set_rotation(){
		if(is_rotated()){
			internal.controls.style['writing-mode'] = 'vertical-rl';
		} else {
			internal.controls.style['writing-mode'] = null;
		}
		internal.container.dispatchEvent(new Event('pointphoto-rotation'));
	}

	function create_element(tag, stylelist, ...children){
		var element = document.createElement(tag);
		for(var key in stylelist){
			element.style[key] = stylelist[key];
		}
		element.append(...children.filter(child=>child instanceof Element));
		return element;
	}

	function create_button(name, onclick, type){
		return create_element('li',{'pointer-events':'auto'},PointPhoto.create_button(name, onclick, type));
	}

	function create_video(){
		var view_unit = CSS.supports('max-height','100dvh') ? 'dv' : 'v';
		var video = create_element('video', {
			'width': '100%',
			'max-height': '100'+view_unit+'h',
			'max-width': '100'+view_unit+'w',
		});
		video.setAttribute('autoplay','');
		video.setAttribute('muted','');
		video.setAttribute('playsinline','');
		video.addEventListener('loadedmetadata',()=>{
			video.play();
			set_rotation();
			set_state('active');
		});
		video.addEventListener('resize',()=>{
			set_rotation();
		});
		return video;
	}

	function blob_to_file(blob){
		var suffix = blob.type == 'image/jpeg' ? '.jpg' : '.png';
		var file_name = internal.file_name + suffix;
		var file = new File([blob],file_name,{'type':blob.type});
		if(internal.file_callback){
			internal.file_callback(file);
			internal.file_object = undefined;
		} else {
			internal.file_object = file;
		}
	}

	function camera_start(){
		var old_media = internal.media;
		var new_media = {
			onload: function(source){
				if(old_media){
					media_stop(old_media);
				}
				internal.video.srcObject = source;
				this.source = source;
				this.onload = undefined;
			}
		}
		new_media.promise = navigator.mediaDevices.getUserMedia({
			video:{
				width:{min:640,ideal:1280,max:1920},
				facingMode:{ideal:internal.facing_mode}
			},
			audio:false
		}).then(source => {
			if(typeof new_media.onload == 'function'){
				new_media.onload(source);
			}
		});
		internal.media = new_media;
	}

	function media_stop(media){
		if(media.onload){
			media.onload = source => source.getTracks().forEach(track => track.stop());
		} else if(media.source){
			media.source.getTracks().forEach(track => track.stop());
		}
	}

	function camera_stop(){
		if(internal.media){
			media_stop(internal.media);
			internal.media = undefined;
		}
		if(internal.video){
			internal.video.srcObject = undefined;
		}
	}

	function camera_snapshot(){
		var width = internal.video.videoWidth;
		var height = internal.video.videoHeight;
		if(is_rotated()){
			internal.canvas.setAttribute('width',height);
			internal.canvas.setAttribute('height',width);
			internal.canvas_context2d.translate(0,width); //move origin, so rotation makes the image land on canvas
			internal.canvas_context2d.rotate(1.5*Math.PI); //rotate 270 degrees aka 90 degrees counter-clockwise
		} else {
			internal.canvas.setAttribute('width',width);
			internal.canvas.setAttribute('height',height);
		}
		internal.canvas_context2d.drawImage(internal.video, 0, 0);
		internal.canvas.toBlob(blob_to_file,'image/jpeg',0.85);
	}

	this.open = function open(file_name, file_callback){
		internal.file_name = file_name;
		internal.file_callback = file_callback;
		set_state('loading');
		internal.container.dispatchEvent(new Event('pointphoto-open'));
		camera_start();
	}

	this.close = function close(reuse){
		if(!internal.media){
			return;
		}
		camera_stop();
		set_state('inactive');
		internal.container.dispatchEvent(new Event('pointphoto-close'));
	}

	this.swap_camera = function swap_camera(){
		internal.facing_mode = internal.facing_mode == 'environment' ? 'user' : 'environment';
		camera_start();
	}

	this.snapshot = function snapshot(keep_open){
		camera_snapshot();
		internal.container.dispatchEvent(new Event('pointphoto-snapshot'));
		if(!keep_open){
			this.close();
		}
		return internal.file_object;
	}
}

PointPhoto.create_button = function create_button(name, onclick, type, disabled){
	var button = document.createElement('button');
	button.classList.add(type == 'danger' ? 'pointphoto-button-danger' : 'pointphoto-button');
	button.setAttribute('type','button');
	button.addEventListener('click',onclick);
	button.append(PointPhoto.create_icon(name));
	if(disabled){
		button.disabled = true;
		button.style.display = 'none';
	}
	return button;
}

PointPhoto.create_icon = function create_icon(name){
	var span = document.createElement('span');
	span.textContent = name;
	return span;
}

PointPhoto.create_camera_loading = function create_camera_loading(){
	var div = document.createElement('div');
	div.replaceChildren(PointPhoto.create_icon('loading'));
	return div;
}
