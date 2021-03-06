import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import {ListService} from '../../../core/firebase/list.service';
import {List} from '../../../model/list/list';

@Component({
    selector: 'app-bulk-addition-popup',
    templateUrl: './bulk-addition-popup.component.html',
    styleUrls: ['./bulk-addition-popup.component.scss']
})
export class BulkAdditionPopupComponent implements OnInit {

    progress = 0;

    constructor(@Inject(MD_DIALOG_DATA) public data: any,
                public dialogRef: MdDialogRef<BulkAdditionPopupComponent>,
                private listService: ListService) {
    }

    ngOnInit(): void {
        let done = 0;
        Observable.concat(...this.data.additions).subscribe((resultList: List) => {
            this.listService.update(this.data.key, resultList).then(() => {
                done++;
                this.progress = Math.ceil(100 * done / this.data.additions.length);
                if (this.progress >= 100) {
                    this.dialogRef.close();
                }
            });
        });
    }
}
