$(function () {
    var $window = $(window),
        resetDiv = $('#reset'),
        prevStepDiv = $('#prevStep'),
        playDiv = $('#play'),
        nextStepDiv = $('#nextStep'),
        speedDiv = $('#threshold'),
        refreshDiv = $('#refresh'),

        progressDiv = $('#progress'),

        viewSwitcherDiv = $('#viewSwicher'),
        jawUpperDiv = $('#jawUpper'),
        jawLowerDiv = $('#jawLower'),
        gumDiv = $('#gum'),
        singleToothDiv = $('#singleTooth'),

        submitDiv = $('#submit'),
        pickDiv = $('#pick'),
        saveDiv = $('#save'),
        textareaDiv = $('#textarea'),

        promptDiv = $('#prompt');

    var sceneDiv = $('#scene');
    sceneDiv.height($window.height() - 150);

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(75, sceneDiv.width() / sceneDiv.height(), 0.1, 1000);
    camera.position.z = 80;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(sceneDiv.width(), sceneDiv.height());
    renderer.setClearColor(0x4682B4);
    sceneDiv.append(renderer.domElement);

    var controls = new THREE.OrbitControls(camera, sceneDiv.get(0));
    var raycaster = new THREE.Raycaster();

    var directionLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionLight.position.copy(camera.position);
    scene.add(directionLight);
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    var loader = new THREE.STLLoader();
    var jawMaterial = new THREE.MeshLambertMaterial({color: 0xFF6666});
    var toothMaterialColor = {
            init: new THREE.Color(0xF5F5F5),
            now: new THREE.Color(0x666666)
    };

    var toothMeshList = {
            list: [],
            current: undefined
        },
        jawLowerMeshList = {
            list: [],
            current: undefined
        },
        jawUpperMeshList = {
            list: [],
            current: undefined
        };

    var RT = {
        r: new THREE.Quaternion(),
        t: new THREE.Vector3(),
    };

    var loading = {
        tooth: undefined,
        jawLower: undefined,
        jawUpper: undefined,
        all: undefined,
        count: 0
    };

    var regExName = /\d{1,2}/;

    //loader.load('/models//519563e0-03f3-11e6-b362-d50176c27e06/jaws/lower/Tooth_LowerJaw_0.stl', function(g) {
    //    scene.add(new THREE.Mesh(g, jawMaterial));
    //});
    //loader.load('/static/model/after/Tooth_UpperJaw.stl', function(g) {
    //    scene.add(new THREE.Mesh(g, jawMaterial));
    //});


    $.get('/play/treatments', function (treatments) {
        var treatment = treatments[0];

        loading.all = treatment.toothPlay.length + treatment.frameNum * 2;
        loading.tooth = treatment.toothPlay.length;
        loading.jawLower = treatment.frameNum;
        loading.jawUpper = treatment.frameNum;

        function afterLoad() {
            var done = Math.floor((++loading.count) / loading.all * 100) + '%';
            progressDiv.children().css('width', done).text(done);

            if (loading.count == loading.all) {
                toothMeshList.list.forEach(function (v) {
                    v.mesh.visible = true;
                });

                jawLowerMeshList.current.mesh.visible = true;
                jawUpperMeshList.current.mesh.visible = true;

                progressDiv.children().css('width', '0%').text('');
                progressDiv.hide();
            }
        }

        progressDiv.show();

        // Load tooth
        treatment.toothPlay.forEach(function (tooth) {
            var rotation = tooth.rotation.split(' '),
                translation = tooth.translation.split(' '),
                matched = regExName.exec(tooth.name)[0]
            if (0 <= matched && matched <= 15) tooth.up = true; else tooth.up = false;
            loader.load(treatment.toothPath + tooth.name, function (g) {
                var mesh = new THREE.Mesh(g, new THREE.MeshPhongMaterial({color: 0xF5F5F5}));
                mesh.userData.tooth = tooth;
                mesh.visible = false;
                toothMeshList.list.push({
                    mesh: mesh,
                    r: new THREE.Quaternion(rotation[1], rotation[2], rotation[3], rotation[0]),
                    t: new THREE.Vector3(translation[0], translation[1], translation[2])
                });
                scene.add(mesh);
                afterLoad();
            });
        });
        // Load Jaw
        for (var i = 0; i < treatment.frameNum; i++) {
            (function (i) {
                loader.load(treatment.jawLowerPath + 'Tooth_LowerJaw_' + i + '.stl', function (g) {
                    var mesh = new THREE.Mesh(g, jawMaterial);
                    mesh.name = 'JawLower_' + i;
                    mesh.visible = false;
                    mesh.userData = undefined;
                    jawLowerMeshList.list.push({
                        mesh: mesh,
                        order: i
                    });
                    scene.add(mesh);
                    if (0 == --loading.jawLower) {
                        jawLowerMeshList.list.sort(function (a, b) {
                            if (a.order > b.order) return 1;
                            else if (a.order < b.order) return -1;
                            else return 0;
                        });
                        jawLowerMeshList.current = jawLowerMeshList.list[0];
                    }
                    afterLoad();
                });
                loader.load(treatment.jawUpperPath + 'Tooth_UpperJaw_' + i + '.stl', function (g) {
                    var mesh = new THREE.Mesh(g, jawMaterial);
                    mesh.name = 'JawUpper_' + i;
                    mesh.visible = false;
                    mesh.userData = undefined;
                    jawUpperMeshList.list.push({
                        mesh: mesh,
                        order: i,
                    });
                    scene.add(mesh);
                    if (0 == --loading.jawUpper) {
                        jawUpperMeshList.list.sort(function (a, b) {
                            if (a.order > b.order) return 1;
                            else if (a.order < b.order) return -1;
                            else return 0;
                        });
                        jawUpperMeshList.current = jawUpperMeshList.list[0];
                    }
                    afterLoad();
                });
            }(i));
        }
    });

    var playControl = {
        frames: 19,
        cycle: 1 / 19,
        step: 0,

        play: false,
    }

    var duration = {
        lastTime: undefined,
        diff: 0,
        threshold: 100,
    };

    var render = function () {

        requestAnimationFrame(render);
        directionLight.position.copy(camera.position);
        renderer.render(scene, camera);

        // Animation and pick after loading
        if (loading.all === loading.count && playControl.play) {

            var now = new Date();
            duration.diff += now - (duration.lastTime ? duration.lastTime : new Date());
            duration.lastTime = now;

            if (playControl.step < playControl.frames && duration.diff >= duration.threshold) {
                playControl.step++;
                // jaw key-frame
                if (!viewAction.single) {
                    if (viewAction.jawLower && viewAction.gum) {
                        jawLowerMeshList.list[playControl.step - 1].mesh.visible = false;
                        jawLowerMeshList.list[playControl.step].mesh.visible = true;
                    }
                    if (viewAction.jawUpper && viewAction.gum) {
                        jawUpperMeshList.list[playControl.step - 1].mesh.visible = false;
                        jawUpperMeshList.list[playControl.step].mesh.visible = true;
                    }
                }
                jawLowerMeshList.current = jawLowerMeshList.list[playControl.step];
                jawUpperMeshList.current = jawUpperMeshList.list[playControl.step];

                // tooth key-frame
                var t = playControl.cycle * playControl.step;
                if (t == 1)  {
                    // When t=1 all will dispear
                    t = 0.99;
                    // Update play btn
                    playDiv.children().removeClass('glyphicon-play').addClass('glyphicon-pause');
                    playControl.play = false;
                }
                toothMeshList.list.forEach(function (v) {
                    v.mesh.position.lerpVectors(RT.t, v.t, t);
                    THREE.Quaternion.slerp(RT.r, v.r, v.mesh.quaternion, t);
                });

                // update progress
                progressDiv.children().css('width', Math.floor((t == 0.99 ? 1 : t) * 100) + '%');

                duration.diff -= duration.threshold;
            }
        }
        // Pick tooth
        if (loading.all === loading.count) {
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh
                && intersects[0].object.userData) {

                toothMeshList.list.forEach(function(v) {
                    v.mesh.material.color = toothMaterialColor.init;
                });
                toothMeshList.current = intersects[0].object;
                toothMeshList.current.material.color = toothMaterialColor.now;

                pickDiv.val(toothMeshList.current.userData.tooth.name);
                textareaDiv.val(toothMeshList.current.userData.tooth.comment);
                mouse.set(-1, -1);
            }
        }
    }

    render();

    var mouse = new THREE.Vector2(-1, -1);
    sceneDiv.on('click', function (e) {
        e.preventDefault();
        mouse.x = (e.offsetX / sceneDiv.width()) * 2 - 1;
        mouse.y = -(e.offsetY / sceneDiv.height()) * 2 + 1;
    });

    $window.on('resize', function () {
        if ($window.height() > 650) {
            sceneDiv.height($window.height() - 150);
            camera.aspect = sceneDiv.width() / sceneDiv.height();
            camera.updateProjectionMatrix();
            renderer.setSize(sceneDiv.width(), sceneDiv.height())
        }
    });

    resetDiv.on('click', function () {
        if (loading.all != loading.count) return;

        toothMeshList.list.forEach(function (v) {
            v.mesh.position.copy(RT.t);
            v.mesh.quaternion.copy(RT.r);
        });

        if (!viewAction.single) {
            if (viewAction.jawLower && viewAction.gum) {
                jawLowerMeshList.current.mesh.visible = false;
                jawLowerMeshList.list[0].mesh.visible = true;
            }
            if (viewAction.jawUpper && viewAction.gum) {
                jawUpperMeshList.current.mesh.visible = false;
                jawUpperMeshList.list[0].mesh.visible = true;
            }
        }
        jawLowerMeshList.current = jawLowerMeshList.list[0];
        jawUpperMeshList.current = jawUpperMeshList.list[0];

        duration.lastTime = undefined;
        duration.diff = 0;
        playControl.play = false;
        playControl.step = 0;
        progressDiv.children().css('width', '0%');
    });

    playDiv.on('click', function () {
        if (playControl.step < playControl.frames) {
            if (playControl.play) {
                playControl.play = false;
                duration.lastTime = undefined;
                duration.diff = 0;
                playDiv.children().removeClass('glyphicon-play').addClass('glyphicon-pause');
            } else {
                playControl.play = true;
                progressDiv.show();
                playDiv.children().removeClass('glyphicon-pause').addClass('glyphicon-play');
            }
        } else {
            resetDiv.trigger('click');
            setTimeout(function() {
                playDiv.children().removeClass('glyphicon-pause').addClass('glyphicon-play');
                playControl.play = true;
            }, 800);
        }

    });

    prevStepDiv.on('click', function() {
        if (playControl.play) {
            promptDiv.find('.modal-body').text('Please pause first!');
            promptDiv.modal('show');
            return;
        }
        if (playControl.step > 0) {
            playControl.step--;
            // jaw key-frame
            if (!viewAction.single) {
                if (viewAction.jawLower && viewAction.gum) {
                    jawLowerMeshList.list[playControl.step + 1].mesh.visible = false;
                    jawLowerMeshList.list[playControl.step].mesh.visible = true;
                }
                if (viewAction.jawUpper && viewAction.gum) {
                    jawUpperMeshList.list[playControl.step + 1].mesh.visible = false;
                    jawUpperMeshList.list[playControl.step].mesh.visible = true;
                }
            }
            jawLowerMeshList.current = jawLowerMeshList.list[playControl.step];
            jawUpperMeshList.current = jawUpperMeshList.list[playControl.step];

            // tooth key-frame
            var t = playControl.cycle * playControl.step;
            toothMeshList.list.forEach(function (v) {
                v.mesh.position.lerpVectors(RT.t, v.t, t);
                THREE.Quaternion.slerp(RT.r, v.r, v.mesh.quaternion, t);
            });

            // update progress
            progressDiv.children().css('width', Math.floor(t * 100) + '%');
        }
    });

    nextStepDiv.on('click', function() {
        if (playControl.play) {
            promptDiv.find('.modal-body').text('Please pause first!');
            promptDiv.modal('show');
            return;
        }
        progressDiv.show();
        if (playControl.step < playControl.frames) {
            playControl.step++;
            // jaw key-frame
            if (!viewAction.single) {
                if (viewAction.jawLower && viewAction.gum) {
                    jawLowerMeshList.list[playControl.step - 1].mesh.visible = false;
                    jawLowerMeshList.list[playControl.step].mesh.visible = true;
                }
                if (viewAction.jawUpper && viewAction.gum) {
                    jawUpperMeshList.list[playControl.step - 1].mesh.visible = false;
                    jawUpperMeshList.list[playControl.step].mesh.visible = true;
                }
            }
            jawLowerMeshList.current = jawLowerMeshList.list[playControl.step];
            jawUpperMeshList.current = jawUpperMeshList.list[playControl.step];

            // tooth key-frame
            var t = playControl.cycle * playControl.step;
            if (t == 1)   t = 0.99;
            toothMeshList.list.forEach(function (v) {
                v.mesh.position.lerpVectors(RT.t, v.t, t);
                THREE.Quaternion.slerp(RT.r, v.r, v.mesh.quaternion, t);
            });

            // update progress
            progressDiv.children().css('width', Math.floor((t == 0.99 ? 1 : t) * 100) + '%');
        }

    });

    refreshDiv.on('click', function() {
        if (playControl.play) {
            promptDiv.find('.modal-body').text('Pause or reset first!');
            promptDiv.modal('show');
        } else {
            if (speedDiv.val().length > 0) {
                duration.threshold = speedDiv.val();
                speedDiv.attr('placeholder', duration.threshold);
                promptDiv.find('.modal-body').text('Speed refreshed');
                promptDiv.modal('show');
            }
        }
    });

    var toothCommentList = [];

    saveDiv.on('click', function() {
        console.log(textareaDiv.val().length);
        if (toothMeshList.current) {
            if (textareaDiv.val().length > 0) {
                toothCommentList.push({
                    id: toothMeshList.current.userData.tooth.id,
                    comment: textareaDiv.val()
                });
                promptDiv.find('.modal-body').text('Comment staged');
                promptDiv.modal('show');
            }
        } else {
            promptDiv.find('.modal-body').text('No tooth selected!');
            promptDiv.modal('show');
        }
    });

    submitDiv.on('click', function() {
        if (toothCommentList.length > 0) {
            $.ajax({
                url: '/play/tooth',
                type: 'POST',
                conentType: 'application/json',
                data: {
                    arr: toothCommentList
                }
            }).done(function(result) {
                console.log(result);
                if (result) {
                    promptDiv.find('.modal-body').text('Commit successful');
                    promptDiv.modal('show');
                    toothCommentList = [];
                } else {
                    promptDiv.find('.modal-body').text('Commit failed');
                    promptDiv.modal('show');
                }
            });
        }
    });

    // View Action
    var viewAction = {
        jawUpper: true,
        jawLower: true,
        gum: true,
        single: false
    }

    viewSwitcherDiv.children().on('click', function () {
        var v = $(this);
        v.siblings().removeClass('btn-primary').addClass('btn-default');
        v.removeClass('btn-default').addClass('btn-primary');
        switch (v.data('view')) {
            case 'front':
                camera.position.set(0, 0, 80);
                break;
            case 'left':
                camera.position.set(-80, 0, 0);
                break;
            case 'right':
                camera.position.set(80, 0, 0);
                break;
            case 'back':
                camera.position.set(0, 0, -80);
                break;
            default:
                break;
        }
        camera.lookAt(scene.position);
    });

    jawUpperDiv.on('click', function () {
        // Hide
        if (viewAction.jawUpper) {
            jawUpperDiv.removeClass('btn-primary').addClass('btn-default');
            jawUpperMeshList.current.mesh.visible = false;
            toothMeshList.list.forEach(function (v) {
                if (v.mesh.userData.tooth.up) {
                    v.mesh.visible = false;
                }
            });
            viewAction.jawUpper = false;
            // Show
        } else {
            jawUpperDiv.removeClass('btn-default').addClass('btn-primary');
            if (viewAction.gum) {
                jawUpperMeshList.current.mesh.visible = true;
            }
            toothMeshList.list.forEach(function (v) {
                if (v.mesh.userData.tooth.up) {
                    v.mesh.visible = true;
                }
            });
            viewAction.jawUpper = true;
        }
    });

    jawLowerDiv.on('click', function () {
        // Hide
        if (viewAction.jawLower) {
            jawLowerDiv.removeClass('btn-primary').addClass('btn-default');
            jawLowerMeshList.current.mesh.visible = false;
            toothMeshList.list.forEach(function (v) {
                if (!v.mesh.userData.tooth.up) {
                    v.mesh.visible = false;
                }
            });
            viewAction.jawLower = false;
            // Show
        } else {
            jawLowerDiv.removeClass('btn-default').addClass('btn-primary');
            if (viewAction.gum) {
                jawLowerMeshList.current.mesh.visible = true;
            }
            toothMeshList.list.forEach(function (v) {
                if (!v.mesh.userData.tooth.up) {
                    v.mesh.visible = true;
                }
            });
            viewAction.jawLower = true;
        }
    });

    gumDiv.on('click', function () {
        // Hide
        if (viewAction.gum) {
            gumDiv.removeClass('btn-primary').addClass('btn-default');
            jawLowerMeshList.current.mesh.visible = false;
            jawUpperMeshList.current.mesh.visible = false;
            viewAction.gum = false;
            // Show
        } else {
            gumDiv.removeClass('btn-default').addClass('btn-primary');
            if (viewAction.jawLower) {
                jawLowerMeshList.current.mesh.visible = true;
            }
            if (viewAction.jawUpper) {
                jawUpperMeshList.current.mesh.visible = true;
            }
            viewAction.gum = true;
        }
    });

    singleToothDiv.on('click', function () {
        if (toothMeshList.current) {
            // Recover others
            if (viewAction.single) {
                singleToothDiv.removeClass('btn-primary').addClass('btn-default');
                if (viewAction.jawLower && viewAction.jawUpper) {
                    if (viewAction.gum) {
                        jawUpperMeshList.current.mesh.visible = true;
                        jawLowerMeshList.current.mesh.visible = true;
                    }
                    toothMeshList.list.forEach(function (v) {
                        v.mesh.visible = true;
                    });
                } else if (viewAction.jawUpper) {
                    if (viewAction.gum) {
                        jawUpperMeshList.current.mesh.visible = true;
                    }
                    toothMeshList.list.forEach(function (v) {
                        if (v.mesh.userData.tooth.up) {
                            v.mesh.visible = true;
                        }
                    });
                } else if (viewAction.jawLower) {
                    if (viewAction.gum) {
                        jawLowerMeshList.current.mesh.visible = true;
                    }
                    toothMeshList.list.forEach(function (v) {
                        if (!v.mesh.userData.tooth.up) {
                            v.mesh.visible = true;
                        }
                    });
                }
                viewAction.single = false;
                jawUpperDiv.prop('disabled', false);
                jawLowerDiv.prop('disabled', false);
                gumDiv.prop('disabled', false);
                // Show single
            } else {
                singleToothDiv.removeClass('btn-default').addClass('btn-primary');
                jawLowerMeshList.current.mesh.visible = false;
                jawUpperMeshList.current.mesh.visible = false;
                toothMeshList.list.forEach(function (v) {
                    if (toothMeshList.current != v.mesh) {
                        v.mesh.visible = false;
                    }
                });
                viewAction.single = true;
                jawUpperDiv.prop('disabled', true);
                jawLowerDiv.prop('disabled', true);
                gumDiv.prop('disabled', true);
            }
        } else {
            promptDiv.find('.modal-body').text('No tooth selected!');
            promptDiv.modal('show');
        }

    });

});