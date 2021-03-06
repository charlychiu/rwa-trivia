import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { isAvailable, requestPermissions, takePicture } from 'nativescript-camera';
import * as imagepicker from 'nativescript-imagepicker';
import * as Toast from 'nativescript-toast';
import { TokenModel } from 'nativescript-ui-autocomplete';
import { RadAutoCompleteTextViewComponent } from 'nativescript-ui-autocomplete/angular';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import { Utils } from 'shared-library/core/services';
import { coreState, UserActions } from 'shared-library/core/store';
import { profileSettingsConstants } from 'shared-library/shared/model';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { ImageAsset } from 'tns-core-modules/image-asset';
import { ImageSource } from 'tns-core-modules/image-source';
import { isAndroid } from 'tns-core-modules/platform';
import { AppState } from '../../../store';
import { ProfileSettings } from './profile-settings';
import * as dialogs from 'tns-core-modules/ui/dialogs';
import { fromAsset } from 'tns-core-modules/image-source';
import { ImageCropper } from 'nativescript-imagecropper';
import { ActivatedRoute } from '@angular/router';
import { SegmentedBar, SegmentedBarItem } from 'tns-core-modules/ui/segmented-bar';
import * as utils from 'tns-core-modules/utils/utils';

@Component({
  selector: 'profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class ProfileSettingsComponent extends ProfileSettings implements OnDestroy {

  // Properties
  showSelectCategory = false;
  showSelectTag = false;
  dataItem;
  customTag: string;
  private tagItems: ObservableArray<TokenModel>;
  SOCIAL_LABEL = 'CONNECT YOUR SOCIAL ACCOUNT';
  @ViewChildren('textField') textField: QueryList<ElementRef>;
  subscriptions = [];

  public imageTaken: ImageAsset;
  public saveToGallery = true;
  public keepAspectRatio = true;
  public width = 200;
  public height = 200;

  public items: Array<SegmentedBarItem>;
  public selectedIndex = 0;
  tabsTitles: Array<string>;


  @ViewChild('autocomplete') autocomplete: RadAutoCompleteTextViewComponent;

  constructor(public fb: FormBuilder,
    public store: Store<AppState>,
    public userAction: UserActions,
    public utils: Utils,
    public cd: ChangeDetectorRef,
    public route: ActivatedRoute) {
    super(fb, store, userAction, utils, cd, route);
    this.initDataItems();
    requestPermissions();
    this.subscriptions.push(this.store.select(coreState).pipe(select(s => s.userProfileSaveStatus)).subscribe(status => {
      if (status === 'SUCCESS') {
        Toast.makeText('Profile is saved successfully').show();
        this.toggleLoader(false);
      }
      this.cd.markForCheck();
    }));
    this.tabsTitles = ['Profile', 'Stats'];
    this.items = [];
    for (let i = 0; i < this.tabsTitles.length; i++) {
      const segmentedBarItem = <SegmentedBarItem>new SegmentedBarItem();
      segmentedBarItem.title = this.tabsTitles[i];
      this.items.push(segmentedBarItem);
    }

  }

  onSelectedIndexChange(args) {
    const segmentedBar = <SegmentedBar>args.object;
    this.selectedIndex = segmentedBar.selectedIndex;
  }

  get dataItems(): ObservableArray<TokenModel> {
    return this.tagItems;
  }


  onTakePhoto() {

    dialogs.action({
      message: 'Choose option',
      cancelButtonText: 'Cancel',
      actions: ['Camera', 'Gallery']
    }).then(result => {
      if (result === 'Camera') {
        this.changeProfilePictureFromCamera();
      } else if (result === 'Gallery') {
        this.changeProfilePictureFromGallery();
      }
    });
  }

  async changeProfilePictureFromCamera() {
    const options = {
      width: this.width,
      height: this.height,
      keepAspectRatio: this.keepAspectRatio,
      saveToGallery: this.saveToGallery
    };

    if (isAvailable()) {

      try {
        const imageAsset = await takePicture(options);
        this.imageTaken = imageAsset;
        const source = new ImageSource();
        const imageSource = await fromAsset(imageAsset);
        this.cropImage(imageSource);
      } catch (error) {
        console.error(error);
      }
    }
  }

  async cropImage(imageSource) {
    try {
      const imageCropper: ImageCropper = new ImageCropper();
      const result: ImageSource = (await imageCropper.show(imageSource,
        { width: 150, height: 140, lockSquare: false })).image;
      if (result) {
        this.profileImage.image = `data:image/jpeg;base64,${result.toBase64String('jpeg', 100)}`;
        this.saveProfileImage();
        this.cd.detectChanges();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async changeProfilePictureFromGallery() {
    try {
      let imageSource = new ImageSource();
      const context = imagepicker.create({
        mode: 'single' // use "multiple" for multiple selection
      });
      await context.authorize();
      const selection = await context.present();
      const imageAsset = selection.length > 0 ? selection[0] : null;
      imageAsset.options = {
        width: this.width,
        height: this.height,
        keepAspectRatio: true
      };
      imageSource = await fromAsset(imageAsset);
      this.cropImage(imageSource);
    } catch (error) {
      console.error(error);
    }


  }

  saveProfileImage() {
    this.getUserFromFormValue(false, '');
    this.assignImageValues();
    this.saveUser(this.user);
  }

  assignImageValues(): void {
    const fileName = `${new Date().getTime()}.jpg`;
    this.user.profilePicture = fileName;
    this.user.originalImageUrl = this.profileImage.image;
    this.user.croppedImageUrl = this.profileImage.image;
    this.user.imageType = 'image/jpeg';
    this.userForm.get('profilePicture').setValue(fileName);
    this.userForm.updateValueAndValidity();
  }

  addCustomTag() {
    this.hideKeyboard();
    this.enteredTags.push(this.customTag);
    this.customTag = '';
    this.autocomplete.autoCompleteTextView.resetAutocomplete();
  }

  selectCategory(category) {
    category.isSelected = (!category.isSelected) ? true : false;
  }

  private initDataItems() {
    this.tagItems = new ObservableArray<TokenModel>();

    for (let i = 0; i < this.tagsAutoComplete.length; i++) {
      this.tagItems.push(new TokenModel(this.tagsAutoComplete[i], undefined));
    }
  }

  public onDidAutoComplete(args) {
    this.customTag = args.text;
  }

  public onTextChanged(args) {
    this.customTag = args.text;
  }

  removeEnteredTag(tag) {
    this.enteredTags = this.enteredTags.filter(t => t !== tag);
  }


  setBulkUploadRequest(checkStatus: boolean): void {
    const userForm = this.userForm.value;
    if (!userForm.name || !userForm.displayName || !userForm.location || !userForm.profilePicture) {
      Toast.makeText('Please add name, display name, location and profile picture for bulk upload request').show();
    } else {
      this.user.bulkUploadPermissionStatus = profileSettingsConstants.NONE;
      this.onSubmit();
    }

  }

  onSubmit(isEditSingleField = false, field = '') {
    // validations
    this.userForm.updateValueAndValidity();

    if (this.profileImageFile) {
      this.assignImageValues();
    }

    if (this.userForm.invalid) {
      Toast.makeText('Please fill the mandatory fields').show();
      return;
    }

    if (isEditSingleField) {
      this.userForm.get(field).disable();
      this.singleFieldEdit[field] = false;
    }

    // get user object from the forms
    this.getUserFromFormValue(isEditSingleField, field);
    this.user.categoryIds = this.userCategories.filter(c => c.isSelected).map(c => c.id);
    // call saveUser
    this.saveUser(this.user);
    this.toggleLoader(false);

  }

  hideKeyboard() {
    this.textField
      .toArray()
      .map((el) => {
        if (isAndroid) {
          el.nativeElement.android.clearFocus();
        }
        return el.nativeElement.dismissSoftInput();
      });
  }

  openUrl(url, id) {
    const fullUrl = `${url}${id}`;
    utils.openUrl(fullUrl);
  }

  ngOnDestroy() {
  }

}
