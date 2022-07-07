// Code inspiration: https://github.com/highhi/itunes-search-client
import axios from "axios";

import { qs } from "../utils";

const BASE_PATH = "https://itunes.apple.com/search";

export type Media = "podcast";

export type Entity = {
    podcast: "podcastAuthor" | "podcast";
};

export type Attribute = {
    podcast:
        | "titleTerm"
        | "languageTerm"
        | "authorTerm"
        | "genreIndex"
        | "artistTerm"
        | "ratingIndex"
        | "keywordsTerm"
        | "descriptionTerm";
};

export type Params<MediaType extends Media> = {
    entity?: Entity[MediaType];
    attribute?: Attribute[MediaType];
    media: Media;
    limit: number;
    term: string;
    lang: string;
    country: string;
};

export enum ItunesWrapperType {
    Track = "track",
    Collection = "collection",
    Artist = "artist"
}

export enum ItunesExplicitnes {
    Explicit = "explicit",
    Cleaned = "cleaned ",
    NotExplicit = "notExplicit"
}

export interface ItunesSearchResult {
    wrapperType: ItunesWrapperType;
    kind: string;

    collectionId: number;
    trackId: number;

    artistName?: string;
    collectionName?: string;
    trackName?: string;
    collectionCensoredName?: string;
    trackCensoredName?: string;
    collectionViewUrl?: string;
    feedUrl?: string;
    trackViewUrl?: string;
    artworkUrl30?: string;
    artworkUrl60?: string;
    artworkUrl100?: string;
    artworkUrl600?: string;
    collectionPrice?: number;
    trackPrice?: number;
    trackRentalPrice?: number;
    collectionHdPrice?: number;
    trackHdPrice?: number;
    trackHdRentalPrice?: number;
    releaseDate?: string;
    collectionExplicitness?: ItunesExplicitnes;
    trackExplicitness?: ItunesExplicitnes;
    trackCount?: string;
    country?: string;
    currency?: string;
    primaryGenreName?: string;
    contentAdvisoryRating?: string;
    genreIds?: string[];
    genres?: string[];
}

export type ItunesSearchClient<MediaType extends Media> = {
    getParams(): Params<MediaType>;
    getUrl(): string;
    entity(value: Entity[MediaType]): ItunesSearchClient<MediaType>;
    attribute(value: Attribute[MediaType]): ItunesSearchClient<MediaType>;
    limit(value: number): ItunesSearchClient<MediaType>;
    send(options?: Request): Promise<ItunesSearchResult>;
};

class Client<MediaType extends Media> implements ItunesSearchClient<MediaType> {
    private params: Params<MediaType>;

    constructor(params: Params<MediaType>) {
        this.params = params;
    }

    getParams() {
        return { ...this.params };
    }

    getUrl() {
        const queries = qs(this.params);
        return `${BASE_PATH}?${queries}`;
    }

    entity(value: Entity[MediaType]) {
        return this.create("entity", value);
    }

    attribute(value: Attribute[MediaType]) {
        return this.create("attribute", value);
    }

    limit(value: number) {
        return this.create("limit", value);
    }

    async send(options?: Request) {
        try {
            const { status, data } = await axios.request({
                url: BASE_PATH,
                method: "GET",
                params: this.params
            });

            return data;
        } catch (e) {
            if (axios.isAxiosError(e)) {
                console.log("error message: ", e.message);
                return e.message;
            } else {
                console.log("unexpected error: ", e);
                return "An unexpected error occurred";
            }
        }
    }

    private create = <Key extends keyof Params<MediaType>>(
        key: Key,
        value: Params<MediaType>[Key]
    ): ItunesSearchClient<MediaType> => {
        return new Client({ ...this.params, [key]: value });
    };
}

type Options = {
    limit?: number;
    lang?: string;
    country?: string;
};

class ItunesSearch {
    private term = "";
    private options: Options = {};

    constructor(term: string, options: Options = {}) {
        this.term = term;
        this.options = options;
    }

    media = <M extends Media>(value: M): ItunesSearchClient<M> => {
        const params: Params<M> = Object.create(null);
        params["term"] = this.term;
        params["media"] = value;
        params["limit"] = this.options.limit || 10;
        params["lang"] = this.options.lang || "en_us";
        params["country"] = this.options.country || "us";

        return new Client(params);
    };
}

export default function itunesSearch(
    term: string,
    options: Options = {}
): ItunesSearch {
    return new ItunesSearch(term, options);
}

export { itunesSearch as apple };
