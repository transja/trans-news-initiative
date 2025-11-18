import leanData from "../data/lean.csv";

export const getPublicationName = (publication) => {
    const label = leanData.find((d) => d.domain === publication)?.label
    if (!label) return publication
    return label;
};

export const getPublicationDomain = (name) => {
    const domain = leanData.find((d) => d.label === name)?.domain
    if (!domain) return name
    return domain;
};