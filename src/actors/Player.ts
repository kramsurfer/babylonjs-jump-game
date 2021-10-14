import {Material, Mesh, MeshBuilder, Node, Ray, Scene, StandardMaterial, TransformNode, Vector3, WebXRAbstractMotionController, WebXRCamera, WebXRDefaultExperienceOptions, WebXRExperienceHelper, WebXRState} from "@babylonjs/core";

class Player {

    _xrHelper : WebXRExperienceHelper;
    _triggerDown : boolean;
    _triggerFirstDown : boolean;
    _gripTriggerDown: boolean;
    _inXR:boolean;
    _character;
    _handedness:string = "right";
    _leftController;
    _rightController;
    _jumpSpeed: Vector3 = new Vector3(0,0,-0.011);
    _controlVector : Vector3 = new Vector3( 1,1,1 );
    _powerCount :number = 100;
    _startPosition;
    _velocityVector : Vector3 = new Vector3( 0,0,0);
    _gravity: Vector3 = new Vector3( 0,-0.009,0);
    _skid: Vector3 = new Vector3( 0.2,0.2,0.2);
    _powerNode: Mesh;
    _bottomPin: Mesh;
    _parked:Boolean;

    _playerSphere:Mesh;
    _lastTimeStamp: number;

    constructor( scene, startPos ) {


        this._bottomPin = MeshBuilder.CreateSphere("sphere", { diameter: 0.025 }, scene );
        this._bottomPin.isPickable = false;

        this._playerSphere = MeshBuilder.CreateSphere("playerSphere", { diameter: 0.5 }, scene );
        this._playerSphere.checkCollisions = true;

        scene.collisionsEnabled = true

        this._startPosition = startPos;
        let raycastFloorPos

        scene.registerBeforeRender(()=>{
            /* delta calculation */
            const now = performance.now()
            const delta = (now - this._lastTimeStamp)/1000
            this._lastTimeStamp = now

            if ( this._inXR ) {
                let cam = scene.activeCamera.inputs.camera;

                if ( this._triggerDown ){
                    if ( this._triggerFirstDown ){
                        //this._playerSphere.position.addInPlace( new Vector3(0,0.4,0));
                        this._triggerFirstDown = false;
                    }
                    this._powerCount -= 1;
                    if ( this._powerCount < 0  ){
                        this._controlVector = new Vector3( 0.75,0.70,0.75 );
                    }
                    this._velocityVector.addInPlace(this._rightController.getDirection( this._jumpSpeed ).multiply( this._controlVector) );
                }

                if ( this._velocityVector.y < -0.2 ) this._velocityVector.y = -0.2;
                if ( this._velocityVector.y > 0.15 ) this._velocityVector.y = 0.15;



                /* movement */
                const spMove = new Vector3((this._velocityVector.x * delta),(this._velocityVector.y * delta),(this._velocityVector.z * delta)  );

                //console.log( ">>", this._playerSphere );
                //console.log(this._velocityVector);
                let chkCol;
                for (let i = 0; i < 30; i++) {
                    chkCol = this._playerSphere.moveWithCollisions( spMove );
                }

                if ( this._velocityVector.x != 0 ){
                    if ( this._velocityVector.y != 0 ){
                        if ( this._velocityVector.z != 0 ){
                            scene.activeCamera.inputs.camera.position = this._playerSphere.position;
                        }
                    }
                }

                //console.log( "chkCol",chkCol );
                //cam.position.addInPlace( this._velocityVector )

                //console.log(cam);
                if ( this._triggerDown === false ) {
                    raycastFloorPos = new Vector3(this._playerSphere.position.x, this._playerSphere.position.y - 0.5, this._playerSphere.position.z);

                    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), 0.6);
                    let predicate = function (mesh) {
                        return mesh.isPickable && mesh.isEnabled();
                    }

                    let pick = scene.pickWithRay(ray, predicate);
                    if (pick.hit === false) {
                        this._velocityVector.addInPlace(this._gravity)
                        if (this._gripTriggerDown) {
                            this._velocityVector.x = 0;
                            this._velocityVector.z = 0;
                        }
                    } else {
                        this._velocityVector.y = 0;
                        this._velocityVector.multiplyInPlace(this._skid);
                        console.log("skid");
                        if (this._powerCount < 100) {
                            this._powerCount += 5;
                            if (this._powerCount > 90) {
                                this._controlVector = new Vector3(1, 1, 1);
                            }
                        }
                    }
                }
                if ( this._powerNode.material ){
                    (this._powerNode.material as StandardMaterial).emissiveColor.r = (this._powerNode.material as StandardMaterial).diffuseColor.r = ( this._powerCount/110.0 ) ;
                }



                //(this._playerSphere as Mesh).moveWithCollisions( this._velocityVector );

            }
        },30);

    }

    async createScene_EnableXR( scene:Scene, Box_Left_Trigger ) {
        let t : WebXRDefaultExperienceOptions = new WebXRDefaultExperienceOptions();
        this._powerNode = Box_Left_Trigger;

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
                        scene.activeCamera.inputs.camera.position = this._startPosition;
                        scene.gravity = new Vector3(0,0,0);
                        //scene.activeCamera.parent = this._playerSphere;
                        // (scene.activeCamera as WebXRCamera).checkCollisions = true;
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
                            }
                            else{
                                this._rightController = mc;
                                this._powerNode.parent = this._rightController;
                            }
                        });
                    }

                    const xr_ids = motionController.getComponentIds();

                    let triggerComponent = motionController.getComponent(xr_ids[0]);//xr-standard-trigger
                    triggerComponent.onButtonStateChangedObservable.add(() => {
                        if (triggerComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                            this._triggerDown = true;
                            this._triggerFirstDown = true;
                        } else {
                            Box_Left_Trigger.scaling = new Vector3(1, 1, 1);
                            this._triggerDown = false;
                        }
                    });

                    let squeezeComponent = motionController.getComponent(xr_ids[1]);//xr-standard-squeeze
                    squeezeComponent.onButtonStateChangedObservable.add(() => {
                        if (squeezeComponent.pressed) {
                            Box_Left_Trigger.scaling = new Vector3(1.2, 1.2, 1.2);
                            this._gripTriggerDown = true;
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
            new BABYLON.ExecuteCodeAction({
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'e' //press "e" key
                },
                function () {
                    this._xrHelper.exitVR();
                    document.exitFullscreen();
                }
            ));

         */
        //scene.actionManager = new BABYLON.ActionManager(scene);


    }
}
export {Player}
