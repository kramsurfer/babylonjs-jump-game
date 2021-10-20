import {
    Color3,
    Color4,
    Material,
    Mesh,
    MeshBuilder,
    Node,
    ParticleSystem,
    Ray,
    Scene,
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
    _triggerDown : boolean;
    _triggerFirstDown : boolean = true;
    _gripTriggerDown: boolean;
    _inXR:boolean;
    _character;
    _handedness:string = "right";
    _leftController;
    _rightController;

    _controlVector : Vector3 = new Vector3( 0,0,-0.005 );
    _powerCount :number = 100;
    _startPosition;
    _velocityVector : Vector3 = new Vector3( 0,0,0);
    _gravity: Vector3 = new Vector3( 0,-0.009,0);
    _skid: Vector3 = new Vector3( 0.2,0.2,0.2);
    _powerNode: Mesh;
    _parked:Boolean;
    _particleSystem:ParticleSystem
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
        this._particleSystem = new ParticleSystem("particles", 1000, scene);

        //Texture of each particle
        this._particleSystem.particleTexture = new Texture("assets/textures/flare.png", scene);

        // Where the particles come from
        this._particleSystem.emitter = Vector3.Zero(); // the starting location

        // Colors of all particles
        this._particleSystem.color1 = new Color4(1, 0.92, 0.7);
        this._particleSystem.color2 = new Color4(1, 0.29, 0.2);
        this._particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

        // Size of each particle (random between...
        this._particleSystem.minSize = 0.01;
        this._particleSystem.maxSize = 0.05;

        // Life time of each particle (random between...
        this._particleSystem.minLifeTime = 0.3;
        this._particleSystem.maxLifeTime = 1.5;

        // Emission rate
        this._particleSystem.emitRate = 100;

        /******* Emission Space ********/
        this._particleSystem.createPointEmitter(new Vector3(0.075,  0.075, 0.8), new Vector3(-0.1, -0.1,0.5));

        // Speed
        this._particleSystem.minEmitPower = 1;
        this._particleSystem.maxEmitPower = 3;
        this._particleSystem.updateSpeed = 0.01;

        // Start the particle system
        this._particleSystem.start();


        scene.registerBeforeRender(()=>{
            /* delta calculation */
            const now = performance.now()
            const delta = (now - this._lastTimeStamp)/1000
            this._lastTimeStamp = now

            if ( this._inXR ) {
                let cam = scene.activeCamera.inputs.camera;

                if (this._triggerDown) {

                    if (this._triggerFirstDown) {
                        //this._playerSphere.position.addInPlace( new Vector3(0,0.05,0));
                        this._velocityVector = new Vector3(0, 0.1, 0);
                        this._triggerFirstDown = false;
                    }

                    this._powerCount -= 1;
                    if (this._powerCount < 0) {
                        this._controlVector = new Vector3(0,0,(-0.1 * delta) );
                        this._particleSystem.emitRate =  0;
                    }else{
                        this._particleSystem.emitRate =  this._powerCount*10;
                    }
                    let controlVect:Vector3 = this._rightController.getDirection(this._controlVector)
                    controlVect.multiplyInPlace(new Vector3(0.4,1,0.4));
                    this._velocityVector.addInPlace( controlVect );
                }else{
                    this._particleSystem.emitRate = 0;
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
                tellme.innerText = chkLen.toString();
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
                        if (this._powerCount < 100) {
                            this._powerCount += 5;
                            if (this._powerCount > 90) {
                                this._controlVector = new Vector3( 0,0,-0.8 * delta );
                                this._triggerFirstDown = true;
                            }
                        }
                    }
                }

                if ( this._powerNode.material ){
                    (this._powerNode.material as StandardMaterial).emissiveColor.r = (this._powerNode.material as StandardMaterial).diffuseColor.r = ( this._powerCount/110.0 ) ;

                }
                //tellme.innerText = delta.toString();//this._velocityVector.y.toString();

                //(this._playerSphere as Mesh).moveWithCollisions( this._velocityVector );
            }
        },30);

    }

    async createScene_EnableXR( scene:Scene, Box_Left_Trigger ) {
        let t : WebXRDefaultExperienceOptions = new WebXRDefaultExperienceOptions();
        this._powerNode = Box_Left_Trigger;
        let cone = MeshBuilder.CreateCylinder("cylinder", {height:0.15, diameterTop:0.05, diameterBottom: 0.01})
        cone.rotate( new Vector3(1,0,0), 1.57)
        cone.material = new StandardMaterial("cone", scene);
        (cone.material as StandardMaterial).emissiveColor = new Color3( 0.25,0.25,0.25);

        cone.setParent( this._powerNode );

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

                    // hands are controllers to; do not want to go do this code; when it is a hand
                    if ( motionController.handedness != "none") {
                        const isLeft = motionController.handedness === 'left';
                        controller.onMeshLoadedObservable.add((mc) => {
                            console.log( "controller",mc )
                            if (isLeft) {
                                this._leftController = mc;
                                (this._leftController.getChildren())[0].setEnabled(false)
                            }
                            else{
                                this._rightController = mc;
                                this._powerNode.parent = this._rightController;
                                (this._rightController.getChildren())[0].setEnabled(false)
                                this._rightController.opacity =0;
                                this._particleSystem.emitter = this._powerNode;
                                console.log('this._rightController',this._rightController);
                            }
                        });
                    }

                    const xr_ids = motionController.getComponentIds();

                    let triggerComponent = motionController.getComponent(xr_ids[0]);//xr-standard-trigger
                    triggerComponent.onButtonStateChangedObservable.add(() => {
                        if (triggerComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                            this._triggerDown = true;
                        } else {
                            Box_Left_Trigger.scaling = new Vector3(1, 1, 1);
                            this._triggerDown = false;
                            if (this._powerCount < 0) {
                                this._powerCount = 0;
                            }
                        }
                    });

                    let squeezeComponent = motionController.getComponent(xr_ids[1]);//xr-standard-squeeze
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        if (squeezeComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                            this._gripTriggerDown = true;
                            this._velocityVector.x = 0;
                            this._velocityVector.z = 0;
                        } else {
                            Box_Left_Trigger.scaling = new Vector3(1, 1, 1);
                            this._gripTriggerDown = false;
                        }
                    });

                    let thumbstickComponent = motionController.getComponent(xr_ids[2]);//xr-standard-thumbstick
                    thumbstickComponent.onButtonStateChangedObservable.add(() => {
                        if (thumbstickComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                        } else {
                            Box_Left_Trigger.scaling = new Vector3(1, 1, 1);
                        }
                        /*
                            let axes = thumbstickComponent.axes;
                            Box_Left_ThumbStick.position.x += axes.x;
                            Box_Left_ThumbStick.position.y += axes.y;
                        */
                    });

                    thumbstickComponent.onAxisValueChangedObservable.add((axes) => {
                    });

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
