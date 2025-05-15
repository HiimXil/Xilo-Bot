export type EpicGamesFree = {
  errors: Error[];
  data: Data;
};

export type Data = {
  Catalog: Catalog;
};

export type Catalog = {
  searchStore: SearchStore;
};

export type SearchStore = {
  elements: Element[];
  paging: Paging;
};

export type Element = {
  title: string;
  id: string;
  namespace: string;
  description: string;
  effectiveDate: Date;
  offerType: string;
  expiryDate: null;
  viewableDate: Date;
  status: string;
  isCodeRedemptionOnly: boolean;
  keyImages: KeyImage[];
  seller: Seller;
  productSlug: null | string;
  urlSlug: string;
  url: null;
  items: Item[];
  customAttributes: CustomAttribute[];
  categories: Category[];
  tags: Tag[];
  catalogNs: CatalogNS;
  offerMappings: Mapping[] | null;
  price: Price;
  promotions: Promotions | null;
};

export type CatalogNS = {
  mappings: Mapping[] | null;
};

export type Mapping = {
  pageSlug: string;
  pageType: string;
};

export type Category = {
  path: string;
};

export type CustomAttribute = {
  key: string;
  value: string;
};

export type Item = {
  id: string;
  namespace: string;
};

export type KeyImage = {
  type: string;
  url: string;
};

export type Price = {
  totalPrice: TotalPrice;
  lineOffers: LineOffer[];
};

export type LineOffer = {
  appliedRules: AppliedRule[];
};

export type AppliedRule = {
  id: string;
  endDate: Date;
  discountSetting: AppliedRuleDiscountSetting;
};

export type AppliedRuleDiscountSetting = {
  discountType: string;
};

export type TotalPrice = {
  discountPrice: number;
  originalPrice: number;
  voucherDiscount: number;
  discount: number;
  currencyCode: string;
  currencyInfo: CurrencyInfo;
  fmtPrice: FmtPrice;
};

export type CurrencyInfo = {
  decimals: number;
};

export type FmtPrice = {
  originalPrice: string;
  discountPrice: string;
  intermediatePrice: string;
};

export type Promotions = {
  promotionalOffers: PromotionalOffer[];
  upcomingPromotionalOffers: PromotionalOffer[];
};

export type PromotionalOffer = {
  promotionalOffers: PromotionalOfferPromotionalOffer[];
};

export type PromotionalOfferPromotionalOffer = {
  startDate: Date;
  endDate: Date;
  discountSetting: PromotionalOfferDiscountSetting;
};

export type PromotionalOfferDiscountSetting = {
  discountType: string;
  discountPercentage: number;
};

export type Seller = {
  id: string;
  name: string;
};

export type Tag = {
  id: string;
};

export type Paging = {
  count: number;
  total: number;
};

export type Error = {
  message: string;
  locations: Location[];
  correlationId: string;
  serviceResponse: string;
  stack: null;
  path: Array<number | string>;
  status: number;
};

export type Location = {
  line: number;
  column: number;
};
