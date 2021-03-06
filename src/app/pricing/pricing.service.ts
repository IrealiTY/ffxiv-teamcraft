import {Injectable} from '@angular/core';
import {ListRow} from '../model/list/list-row';
import {Price} from './model/price';
import {ItemAmount} from './model/item-amount';
import {Ingredient} from '../model/garland-tools/ingredient';

@Injectable()
export class PricingService {

    /**
     * Object representation of current stored prices
     */
    private prices: { [index: number]: Price };

    /**
     * Object representation of current stored amounts
     */
    private amounts: { [index: string]: { [index: number]: ItemAmount } };

    constructor() {
        this.prices = this.parsePrices(localStorage.getItem('prices'));
        this.amounts = JSON.parse(localStorage.getItem('amounts')) || {};
    }

    /**
     * Parses a given string coming from localStorage to create an object from it.
     *
     * This is in a specific method so it'll be easier to change data storage later on,
     * as localStorage has a limit of 10Mb we want to optimize that.
     *
     * @param {string} data
     */
    private parsePrices(data: string): { [index: number]: Price } {
        const result = {};
        if (data === null) {
            return result;
        }
        data.split(';').forEach(row => {
            // The last row of the parse will be '', we don't want to parse this one as it doesn't have any data.
            if (row === '') {
                return;
            }
            const rowId = +row.split(':')[0];
            const rowData = row.split(':')[1].split(',');
            result[rowId] = {
                nq: +rowData[0],
                hq: +rowData[1],
                fromvendor: +rowData[2] === 1
            };
        });
        return result;
    }

    /**
     * Stringifies a given object in order to store it in localStorage.
     *
     * @param {string} data
     */
    private stringifyPrices(data: { [index: number]: Price }) {
        let resultString = '';
        for (const index in data) {
            if (data.hasOwnProperty(index)) {
                resultString += `${index.toString()}:${data[index].nq},${data[index].hq},${data[index].fromVendor ? 1 : 0};`;
            }
        }
        return resultString;
    }

    /**
     * Saves a given price to the storage system
     * @param {ListRow} item
     * @param {Price} price
     */
    savePrice(item: ListRow, price: Price): void {
        this.prices[item.id] = price;
        this.persistPrices();
    }

    /**
     * Saves a given amount to the storage system
     * @param listUid
     * @param {ListRow} item
     * @param {Price} amount
     */
    saveAmount(listUid: string, item: ListRow, amount: ItemAmount): void {
        if (this.amounts[listUid] === undefined) {
            this.amounts[listUid] = {};
        }
        this.amounts[listUid][item.id] = amount;
        this.persistAmounts();
    }

    /**
     * Gets the gils value of an item, looking on local storage first, then looks for vendors informations.
     *
     * If nothing is found, returns 0.
     * @param {ListRow} item
     * @returns {number}
     */
    getPrice(item: ListRow): Price {
        const storedValue = this.prices[item.id];
        if (storedValue !== undefined) {
            storedValue.fromVendor = false;
            return storedValue;
        }
        if (item.vendors !== undefined && item.vendors.length > 0) {
            const cheapest = item.vendors.sort((a, b) => {
                return a.price - b.price;
            })[0];
            return {nq: cheapest.price, hq: 0, fromVendor: true};
        }
        return {nq: 0, hq: 0, fromVendor: false};
    }

    /**
     * Gets the amount of nq and hq items used for a given list, if nothing is found in localStorage, returns a default object
     * with item.amount as nq amount and 0 as hq amount.
     *
     * @param listUid
     * @param {ListRow} item
     * @returns {ItemAmount}
     */
    getAmount(listUid: string, item: ListRow): ItemAmount {
        const listStore = this.amounts[listUid];
        if (listStore !== undefined) {
            const storedValue = listStore[item.id];
            if (storedValue !== undefined) {
                return storedValue;
            }
        }
        return {nq: item.amount, hq: 0};
    }

    /**
     * Persists the current prices to localStorage.
     */
    private persistPrices(): void {
        localStorage.setItem('prices', this.stringifyPrices(this.prices));
    }

    /**
     * Perists amounts into localStorage.
     */
    private persistAmounts(): void {
        localStorage.setItem('amounts', JSON.stringify(this.amounts));
    }
}
