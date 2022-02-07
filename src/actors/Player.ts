import {
    Color3,
    Color4,
    Material,
    Mesh,
    MeshBuilder,
    Node,
    ParticleSystem,
    Ray,
    Scene, SceneLoader,
    StandardMaterial, Texture,
    TransformNode,
    Vector3,
    WebXRAbstractMotionController,
    WebXRCamera,
    WebXRDefaultExperienceOptions,
    WebXRExperienceHelper,
    WebXRState
} from "@babylonjs/core";

class Player {

    _xrHelper : WebXRExperienceHelper;
    _thrustTriggerDownRight : boolean;
    _thrustTriggerDownLeft : boolean;
    
    _powerCountRight :number = 100;
    _powerCountLeft :number = 100;

    _powerMeshRight: Mesh;
    _powerMeshLeft: Mesh;
    
    _leftController;
    _rightController;

    _thrusterMeshRight:TransformNode;
    _thrusterMeshLeft:TransformNode;

    _particleSystemRight:ParticleSystem;
    _particleSystemLeft:ParticleSystem;
    
    
    _singleTriggerMode : boolean = true;
    _triggerFirstDown : boolean = true;

    _gripTriggerDown: boolean;
    
    _inXR:boolean;
  
    _controlVector : Vector3 = new Vector3( 0,0,-0.005 );
    _velocityVector : Vector3 = new Vector3( 0,0,0);
    
    _startPosition;
    _gravity: Vector3 = new Vector3( 0,-0.009,0);
    _skid: Vector3 = new Vector3( 0.2,0.2,0.2);


    _playerSphere:Mesh;
    _lastTimeStamp: number;

    constructor( scene, startPos ) {

        this._playerSphere = MeshBuilder.CreateSphere("playerSphere", { diameter: 0.005 }, scene );
        this._playerSphere.checkCollisions = true;

        scene.collisionsEnabled = true

        this._startPosition = startPos;
        let raycastFloorPos
        let tellme = document.getElementById('tellme');

        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        // Create a particle system
        this._particleSystemLeft =  this.createScene_rocketParticleSystem( scene, "leftThruster_particles" );
        this._particleSystemRight =  this.createScene_rocketParticleSystem( scene, "RightThruster_particles" );


        SceneLoader.ImportMesh("", "assets/Sword/", "sword.babylon",scene,( meshes,p,s,a,atr,ag,al)=>{
            /* remove any lights */
            for ( let l of al ){ l.dispose(); }
            this._thrusterMeshRight = new TransformNode( scene );
            this._thrusterMeshLeft = new TransformNode( scene );

            let totMesh = meshes.length;
            for ( let mIndex = (totMesh-1); mIndex>-1; -- mIndex ) {
                meshes[ mIndex ].setParent( this._thrusterMeshRight );

                let lefT = (meshes[ mIndex ] as Mesh).clone("Left_Thrust-" + meshes[ mIndex ].name )
                lefT.setParent( this._thrusterMeshLeft );
                
                if ( meshes[ mIndex ].name === "Rocket_Status" ){
                    this._powerMeshRight = ( meshes[mIndex] as Mesh )
                    let sMat:StandardMaterial = new StandardMaterial("Right_Thrust-PowerMaterial", scene );
                    sMat.diffuseColor = new Color3( 1, 0 ,0 );
                    this._powerMeshRight.material = sMat;

                    sMat = new StandardMaterial("Left_Thrust-PowerMaterial", scene );
                    sMat.diffuseColor = new Color3( 1, 0 ,0 );
                    this._powerMeshLeft = lefT;
                    this._powerMeshLeft.material = sMat;
                }

                meshes[ mIndex ].name = "Right_Thrust-" + meshes[ mIndex ].name
            }

            this._thrusterMeshRight.rotate( new Vector3(-1,0,0), 1.57 );
            this._thrusterMeshLeft.rotate( new Vector3(-1,0,0), 1.57 );
        });

        scene.registerBeforeRender(()=>{
            /* delta calculation */
            const now = performance.now()
            const delta = (now - this._lastTimeStamp)/1000
            this._lastTimeStamp = now
            const zPowerPerFrame =  new Vector3(0, 0, (-0.9 * delta));

            if ( this._inXR ) {
                let cam = scene.activeCamera.inputs.camera;
                if ( this._thrustTriggerDownRight || this._thrustTriggerDownLeft ) {

                    let controlVect:Vector3 = new Vector3(0,0,0);

                    if ( this._triggerFirstDown ) {
                        //this._playerSphere.position.addInPlace( new Vector3(0,0.05,0));
                        this._velocityVector = new Vector3(0, 0.1, 0);
                        this._triggerFirstDown = false;
                    }

                    this._controlVector = new Vector3(0, 0, 0);

                    if ( this._thrustTriggerDownRight ) {
                        this._powerCountRight -= 1;
                        if (this._powerCountRight < 0) {
                            this._particleSystemRight.emitRate = 0;
                        } else {
                            this._particleSystemRight.emitRate = this._powerCountRight * 10;
                            controlVect.addInPlace( this._rightController.getDirection( zPowerPerFrame ));
                        }
                    }

                    if ( this._thrustTriggerDownLeft ) {
                        this._powerCountLeft -= 1;
                        if (this._powerCountLeft < 0) {
                            this._particleSystemLeft.emitRate = 0;
                        } else {
                            this._particleSystemLeft.emitRate = this._powerCountLeft * 10;
                            controlVect.addInPlace( this._leftController.getDirection( zPowerPerFrame ));
                        }
                    }

                    controlVect.multiplyInPlace(new Vector3(0.4,1,0.4));
                    this._velocityVector.addInPlace( controlVect );



                }else{
                    this._particleSystemRight.emitRate = 0;
                    this._particleSystemLeft.emitRate = 0;
                }

                if ( this._powerMeshRight.material ){
                    (this._powerMeshRight.material as StandardMaterial).emissiveColor.r = (this._powerMeshRight.material as StandardMaterial).diffuseColor.r = ( this._powerCountRight/110.0 ) ;
                }

                if ( this._powerMeshLeft.material ){
                    (this._powerMeshLeft.material as StandardMaterial).emissiveColor.r = (this._powerMeshLeft.material as StandardMaterial).diffuseColor.r = ( this._powerCountLeft/110.0 ) ;
                }

                /* gravity */
                this._velocityVector.y -= 0.0045;
                /* terminal drop speed -0.2 */
                if ( this._velocityVector.y < -0.2 ) this._velocityVector.y = -0.2;
                /* max up speed */
                if ( this._velocityVector.y > 0.15 ) this._velocityVector.y = 0.15;

                /* movement */
                const spMove = new Vector3((this._velocityVector.x * delta),(this._velocityVector.y * delta),(this._velocityVector.z * delta)  );

                let chkLen = this._velocityVector.length();
               // tellme.innerText = chkLen.toString();
                if ( chkLen > 0.05 ) {
                    for (let i = 0; i < 10; i++) {
                        this._playerSphere.moveWithCollisions(spMove);
                    }
                }else{
                    if (chkLen > 0.005) {
                       this._playerSphere.position.addInPlace( spMove.multiplyByFloats(10,10,10) );
                    }
                }


                    scene.activeCamera.inputs.camera.position = this._playerSphere.position.clone();
                //}



                if ( this._velocityVector.y < 0 ) {
                    raycastFloorPos = new Vector3(this._playerSphere.position.x, this._playerSphere.position.y - 0.5, this._playerSphere.position.z);

                    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), 0.6);

                    let pick = scene.pickWithRay(ray, predicate);
                    if (pick.hit === true) {
                        this._velocityVector.x = ( this._velocityVector.x * 0.95);
                        this._velocityVector.z = ( this._velocityVector.z * 0.95);
                        this._velocityVector.y = 0;
                        if (this._powerCountRight < 100) {
                            this._powerCountRight += 5;
                            if (this._powerCountRight > 90) {
                                this._controlVector = new Vector3( 0,0,-0.8 * delta );
                                this._triggerFirstDown = true;
                            }
                        }
                        if (this._powerCountLeft < 100) {
                            this._powerCountLeft += 5;
                            if (this._powerCountLeft > 90) {
                                this._controlVector = new Vector3( 0,0,-0.8 * delta );
                                this._triggerFirstDown = true;
                            }
                        }
                        //tellme.innerText =pick.pickedMesh.name;
                        if ( pick.pickedMesh.name.includes('TARGET') ){
                            if ( pick.pickedMesh.parent.playerVisited === false ){
                                pick.pickedMesh.parent.setTrue();
                            }
                        }

                    }
                }




                //(this._playerSphere as Mesh).moveWithCollisions( this._velocityVector );
            }
        },30);

    }

    createScene_rocketParticleSystem ( scene, partName ): ParticleSystem {
        let retParticleSys = new ParticleSystem(partName, 1000, scene);

        //Texture of each particle
        retParticleSys.particleTexture = new Texture("assets/textures/flare.png", scene);

        // Where the particles come from
        retParticleSys.emitter = Vector3.Zero(); // the starting location

        // Colors of all particles
        retParticleSys.color1 = new Color4(1, 0.92, 0.7);
        retParticleSys.color2 = new Color4(1, 0.29, 0.2);
        retParticleSys.colorDead = new Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        retParticleSys.minSize = 0.01;
        retParticleSys.maxSize = 0.05;

        // Life time of each particle (random between...
        retParticleSys.minLifeTime = 0.3;
        retParticleSys.maxLifeTime = 1.5;

        // Emission rate
        retParticleSys.emitRate = 100;

        /******* Emission Space ********/
        retParticleSys.createPointEmitter(new Vector3(0.075,  0.075, 0.8), new Vector3(-0.1, -0.1,0.5));

        // Speed
        retParticleSys.minEmitPower = 1;
        retParticleSys.maxEmitPower = 3;
        retParticleSys.updateSpeed = 0.01;

        // Start the particle system
        retParticleSys.start();

        return retParticleSys;
    }
    async createScene_EnableXR( scene:Scene, Box_Left_Trigger ) {
        let t : WebXRDefaultExperienceOptions = new WebXRDefaultExperienceOptions();
        
        let particleSystemRight = MeshBuilder.CreateSphere("emitterSphere", { diameter: 0.05, segments:3 }, scene );
        particleSystemRight.translate( new Vector3(0,1,0), -0.07);
        particleSystemRight.isVisible = false;
        let particleSystemLeft = MeshBuilder.CreateSphere("emitterSphere", { diameter: 0.05, segments:3 }, scene );
        particleSystemLeft.translate( new Vector3(0,1,0), -0.07);
        particleSystemLeft.isVisible = false;

        scene.createDefaultXRExperienceAsync( t ).then(respose => {
            this._xrHelper  = respose.baseExperience;
            console.log(respose.input.controllers);

            respose.teleportation.detach();
            respose.pointerSelection.detach()

            this._xrHelper.onStateChangedObservable.add( (state)=>{
                console.log(state);
                switch (state) {
                    case WebXRState.IN_XR:
                        this._inXR = true;

                    case WebXRState.ENTERING_XR:

                        scene.gravity = new Vector3(0,0,0);
                        this._playerSphere.position = this._startPosition;

                        (scene.activeCamera as WebXRCamera).checkCollisions = false
                        console.log('scene.activeCamera',scene.activeCamera)

                    // xr is being initialized, enter XR request was made
                    case WebXRState.EXITING_XR:
                    // xr exit request was made. not yet done.
                    case WebXRState.NOT_IN_XR:
                    // self explanatory - either out or not yet in XR
                }
            })

            respose.input.onControllerAddedObservable.add((controller) => {

                controller.onMotionControllerInitObservable.add((motionController) => {
                    /* assign mesh to handed controllers per hand */
                    controller.onMeshLoadedObservable.add((mc) => {

                        if ( motionController.handedness === 'left' ) {
                            this._leftController = mc;
                            this._thrusterMeshLeft.parent = this._leftController;
                            (this._leftController.getChildren())[0].setEnabled(false)
                            particleSystemLeft.parent = this._thrusterMeshLeft;
                            this._particleSystemLeft.emitter = particleSystemLeft;
                            console.log('this._leftController',this._leftController);
                        }

                        if ( motionController.handedness === 'right' ) {
                            this._rightController = mc;
                            this._thrusterMeshRight.parent = this._rightController;
                            particleSystemRight.parent = this._thrusterMeshRight;
                            (this._rightController.getChildren())[0].setEnabled(false)
                            this._rightController.opacity =0;
                            this._particleSystemRight.emitter = particleSystemRight;
                            console.log('this._rightController',this._rightController);
                        }

                    });

                    /* assign trigger event to handed controllers per hand */
                    const xr_ids = motionController.getComponentIds();
                    let triggerComponent = motionController.getComponent(xr_ids[0]);//xr-standard-trigger

                    if ( motionController.handedness === 'left' ) {
                        triggerComponent.onButtonStateChangedObservable.add(() => {
                            if (triggerComponent.pressed) {
                                this._thrustTriggerDownLeft = true;
                            } else {
                                this._thrustTriggerDownLeft = false;
                                if (this._powerCountLeft < 0) {
                                    this._powerCountLeft = 0;
                                }
                            }
                        });
                    }

                    if ( motionController.handedness === 'right' ) {
                        triggerComponent.onButtonStateChangedObservable.add(() => {
                            if (triggerComponent.pressed) {
                                this._thrustTriggerDownRight = true;
                            } else {
                                this._thrustTriggerDownRight = false;
                                if (this._powerCountRight < 0) {
                                    this._powerCountRight = 0;
                                }
                            }
                        });
                    }

                    let squeezeComponent = motionController.getComponent(xr_ids[1]);//xr-standard-squeeze
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        if (squeezeComponent.pressed) {
                            this._gripTriggerDown = true;
                            this._velocityVector.x = 0;
                            this._velocityVector.z = 0;
                        } else {
                            this._gripTriggerDown = false;
                        }
                    });

                    /*
                    let thumbstickComponent = motionController.getComponent(xr_ids[2]);//xr-standard-thumbstick
                    thumbstickComponent.onButtonStateChangedObservable.add(() => {
                        if (thumbstickComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                        } else {
                            Box_Left_Trigger.scaling = new Vector3(1, 1, 1);
                        }

                        let axes = thumbstickComponent.axes;
                        Box_Left_ThumbStick.position.x += axes.x;
                        Box_Left_ThumbStick.position.y += axes.y;
                    });
                    thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                    });
                    */
                    
                })
            });
        });



        // From fullscreenVR to 2D view
        /*
       this.actionManager.registerAction(
            new ExecuteCodeAction({
                    trigger: ActionManager.OnKeyDownTrigger,
                    parameter: 'e' //press "e" key
                },
                function () {
                    this._xrHelper.exitVR();
                    document.exitFullscreen();
                }
            ));

         */
        //scene.actionManager = new ActionManager(scene);


    }
}
export {Player}
