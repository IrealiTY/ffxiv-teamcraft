import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {TranslateService} from '@ngx-translate/core';
import {GarlandToolsService} from './garland-tools.service';
import {Recipe} from '../../model/list/recipe';
import {I18nName} from '../../model/list/i18n-name';
import {ItemData} from '../../model/garland-tools/item-data';
import {NgSerializerService} from '@kaiu/ng-serializer';
import {SearchFilter} from '../../model/search/search-filter.interface';

@Injectable()
export class DataService {

    private garlandUrl = 'https://www.garlandtools.org/db/data';
    private garlandApiUrl = 'https://www.garlandtools.org/api';

    constructor(private http: HttpClient,
                private i18n: TranslateService,
                private gt: GarlandToolsService,
                private serializer: NgSerializerService) {
    }

    public getItem(id: number): Observable<ItemData> {
        return this.getGarlandData(`/item/${id}`)
            .map(item => this.serializer.deserialize<ItemData>(item, ItemData));
    }

    public getNpc(id: number): any {
        return this.getGarlandData(`/npc/${id}`);
    }

    public searchRecipe(query: string, filters: SearchFilter[]): Observable<Recipe[]> {
        let params = new HttpParams()
            .set('craftable', '1')
            .set('lang', this.i18n.currentLang);

        let craftedByFilter: SearchFilter;

        if (query !== undefined) {
            params = params.set('text', query);
        }

        filters.forEach(filter => {
            if (filter.enabled) {
                if (filter.minMax) {
                    params = params.set(`${filter.filterName}Min`, filter.value.min)
                        .set(`${filter.filterName}Max`, filter.value.max);
                } else if (filter.name === 'filters/worn_by') {
                    params = params.set(filter.filterName, this.gt.getJobCategories(filter.value).join(','));
                } else {
                    params = params.set(filter.filterName, filter.value);
                }
                if (filter.name === 'filters/crafted_by') {
                    craftedByFilter = filter;
                }
            }
        });

        return this.getGarlandSearch(params).map(garlandResults => {
            const recipes: Recipe[] = [];
            garlandResults.forEach(item => {
                item.obj.f.forEach(recipe => {
                    if (craftedByFilter !== undefined && craftedByFilter.value !== recipe.job) {
                        return;
                    }
                    recipes.push({
                        recipeId: recipe.id,
                        itemId: item.id,
                        job: recipe.job,
                        stars: recipe.stars,
                        lvl: recipe.lvl,
                        icon: item.obj.c
                    });
                });
            });
            return recipes;
        });
    }

    public getXivdbUrl(id: number, name: string): I18nName {
        const urlName = name.replace(/ /g, '+').toLowerCase();
        return {
            fr: `http://fr.xivdb.com/item/${id}/${urlName}`,
            en: `http://xivdb.com/item/${id}/${urlName}`,
            de: `http://de.xivdb.com/item/${id}/${urlName}`,
            ja: `http://ja.xivdb.com/item/${id}/${urlName}`
        };
    }

    public searchCharacter(name: string, server: string): Observable<any[]> {
        return this.http.get<any>(`https://xivsync.com/character/search?name=${name}&server=${server}`)
            .map(res => res.data.results)
            .map(res => res.filter(char => char.name.toLowerCase() === name.toLowerCase()));
    }

    public getCharacter(id: number): Observable<any> {
        return this.http.get<any>(`https://xivsync.com/character/parse/${id}`);
    }

    private getGarlandData(uri: string): Observable<any> {
        return this.http.get<any>(this.garlandUrl + uri + '.json');
    }

    private getGarlandSearch(query: HttpParams): Observable<any> {
        return this.http.get<any>(`${this.garlandApiUrl}/search.php`, {params: query});
    }
}
