import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem, ReaddirResult } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  constructor(
    private alertController: AlertController
  ) { }

  ngOnInit(): void {
    if (Capacitor.isNativePlatform()) {
      Filesystem.mkdir({ directory: this.localFolder, path: "store", recursive: true });
    }
  }

  private async alert(message: string, title = "Error") {
    let alert = await this.alertController.create({
      header: title,
      subHeader: '',
      message: message,
    });

    await alert.present();
  }

  public get isNative() {
    return Capacitor.isNativePlatform();
  }

  public pickedFiles: {
    filename: string,
    size: number,
    path?: string,
    mime?: string,
    time?: Date,
  }[] = [];

  public pick(type: "images" | "videos" | "files") {

    let api = (type == "images") ? FilePicker.pickImages : ((type == "videos") ? FilePicker.pickVideos : FilePicker.pickFiles);

    api({
      limit: 0,
      readData: false,
      skipTranscoding: true,
    }).then(result => {
      if (result.files.length == 0) {
        this.pickedFiles = [];
        return;
      }

      this.pickedFiles = result.files.map(e => {
        return {
          filename: e.name,
          size: e.size,
          path: e.path,
          mime: e.mimeType,
          time: (e.modifiedAt != null) ? new Date(e.modifiedAt) : undefined,
        }
      })
    });

  }

  public get localFolder() {
    return ((Capacitor.getPlatform() == "ios" ? Directory.Data : Directory.Data));

  }

  public localFiles: {
    filename: string,
    size: number,
    path: string,
    mime?: string,
    time?: Date,
  }[] = [];

  loadingDir = false;
  public async display() {
    this.localFiles = [];

    this.loadingDir = true;
    let retDir: ReaddirResult | null;
    try {
      retDir = await Filesystem.readdir({ directory: this.localFolder, path: "/store" });
    } catch (err) {
      this.alert("Read dir error directory:" + this.localFolder + "path:/store");
      retDir = null;
    }
    this.loadingDir = false;

    if (retDir == null) return;

    this.localFiles = retDir.files.map(e => {
      return {
        filename: e.name,
        size: e.size,
        path: e.uri,
        mime: undefined,
        time: (e.ctime != null) ? new Date(e.ctime) : undefined
      };
    });
  }

  public copy() {
    this.loadingDir = true;
    let promises = this.pickedFiles.map(e => {
      return Filesystem.copy({ from: e.path as string, toDirectory: this.localFolder, to: "store/" + e.filename });
    });

    Promise.all(promises)
      .then(res => {
        this.display();
      })
      .catch(err => {
        this.alert("Error deleting local files");
        this.display();
      })
      .finally(() => this.loadingDir = false);

  }

  public clear() {
    this.loadingDir = true;
    let promises = this.localFiles.map(e => {
      return Filesystem.deleteFile({ path: e.path });
    });

    Promise.all(promises)
      .then(res => {
        this.display();
      })
      .catch(err => {
        this.alert("Error deleting local files");
        this.display();
      })
      .finally(() => this.loadingDir = false);

  }
}
