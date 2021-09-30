import {Mesh, Node, Ray, Scene, Vector3, WebXRAbstractMotionController, WebXRDefaultExperienceOptions, WebXRExperienceHelper, WebXRState} from "@babylonjs/core";

class Player {

    _xrHelper : WebXRExperienceHelper;
    _triggerDown : boolean;
    _gripTriggerDown: boolean;
    _inXR:boolean;
    _character;
    _handedness:string = "right";
    _leftController;
    _rightController;
    _jumpSpeed: Vector3 = new Vector3(0,0,-0.05);
    _controlVector : Vector3 = new Vector3( 1,1,1 );
    _powerCount :number = 100;

    constructor( scene ) {

        scene.registerBeforeRender(()=>{
            if ( this._inXR ) {
                let cam = scene.activeCamera.inputs.camera;

                if ( this._triggerDown ){
                    this._powerCount -= 1;
                    if ( this._powerCount < 0  ){
                        this._controlVector = new Vector3( 0.5,0,0.5 );
                    }
                    cam.position.addInPlace(this._rightController.getDirection( this._jumpSpeed ).multiply( this._controlVector) );
                }

                let raycastFloorPos = new Vector3(cam.position.x, cam.position.y - 0.5, cam.position.z);
                let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), 0.5);
                let predicate = function (mesh) {
                    return mesh.isPickable && mesh.isEnabled();
                }

                let pick = scene.pickWithRay(ray, predicate);
                if ( pick.hit === false ){
                    cam.position.y -= 0.01;
                    if ( this._gripTriggerDown  ){
                        cam.position.y -= 0.02;
                    }
                }else{
                    if ( this._powerCount < 100){
                        this._powerCount += 5;
                        if ( this._powerCount === 100 ){
                            this._controlVector = new Vector3( 1,1,1 );
                        }
                    }
                }

            }
        });

    }

    async createScene_EnableXR( scene:Scene, Box_Left_Trigger ) {
        let t : WebXRDefaultExperienceOptions = new WebXRDefaultExperienceOptions();

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
