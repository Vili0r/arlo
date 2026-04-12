import { z } from "zod";
export declare const transitionAnimationSchema: z.ZodEnum<{
    slide: "slide";
    fade: "fade";
    none: "none";
}>;
export declare const textAlignSchema: z.ZodEnum<{
    left: "left";
    center: "center";
    right: "right";
}>;
export declare const fontWeightSchema: z.ZodEnum<{
    normal: "normal";
    medium: "medium";
    semibold: "semibold";
    bold: "bold";
}>;
export declare const constraintAnchorSchema: z.ZodEnum<{
    center: "center";
    min: "min";
    max: "max";
    stretch: "stretch";
}>;
export declare const buttonActionSchema: z.ZodEnum<{
    NEXT_SCREEN: "NEXT_SCREEN";
    PREV_SCREEN: "PREV_SCREEN";
    SKIP_FLOW: "SKIP_FLOW";
    OPEN_URL: "OPEN_URL";
    DEEP_LINK: "DEEP_LINK";
    CUSTOM_EVENT: "CUSTOM_EVENT";
    DISMISS: "DISMISS";
    CLOSE_FLOW: "CLOSE_FLOW";
    REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
    REQUEST_TRACKING: "REQUEST_TRACKING";
    RESTORE_PURCHASES: "RESTORE_PURCHASES";
}>;
export declare const ruleOperatorSchema: z.ZodEnum<{
    equals: "equals";
    not_equals: "not_equals";
    contains: "contains";
    not_contains: "not_contains";
    is_set: "is_set";
    is_not_set: "is_not_set";
}>;
export declare const textPropsSchema: z.ZodObject<{
    content: z.ZodString;
    fontSize: z.ZodOptional<z.ZodNumber>;
    fontWeight: z.ZodOptional<z.ZodEnum<{
        normal: "normal";
        medium: "medium";
        semibold: "semibold";
        bold: "bold";
    }>>;
    color: z.ZodOptional<z.ZodString>;
    textAlign: z.ZodOptional<z.ZodEnum<{
        left: "left";
        center: "center";
        right: "right";
    }>>;
    lineHeight: z.ZodOptional<z.ZodNumber>;
    opacity: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const imagePropsSchema: z.ZodObject<{
    src: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    borderRadius: z.ZodOptional<z.ZodNumber>;
    resizeMode: z.ZodOptional<z.ZodEnum<{
        center: "center";
        stretch: "stretch";
        cover: "cover";
        contain: "contain";
    }>>;
    alt: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const lottiePropsSchema: z.ZodObject<{
    src: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    autoPlay: z.ZodOptional<z.ZodBoolean>;
    loop: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const videoPropsSchema: z.ZodObject<{
    src: z.ZodString;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    autoPlay: z.ZodOptional<z.ZodBoolean>;
    loop: z.ZodOptional<z.ZodBoolean>;
    muted: z.ZodOptional<z.ZodBoolean>;
    posterUrl: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const iconPropsSchema: z.ZodObject<{
    name: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const iconLibraryPropsSchema: z.ZodObject<{
    iconName: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    opacity: z.ZodOptional<z.ZodNumber>;
    paddingVertical: z.ZodOptional<z.ZodNumber>;
    paddingHorizontal: z.ZodOptional<z.ZodNumber>;
    marginVertical: z.ZodOptional<z.ZodNumber>;
    marginHorizontal: z.ZodOptional<z.ZodNumber>;
    backgroundColor: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const buttonStyleSchema: z.ZodObject<{
    backgroundColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
    borderRadius: z.ZodOptional<z.ZodNumber>;
    borderColor: z.ZodOptional<z.ZodString>;
    borderWidth: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const buttonPropsSchema: z.ZodObject<{
    label: z.ZodString;
    action: z.ZodEnum<{
        NEXT_SCREEN: "NEXT_SCREEN";
        PREV_SCREEN: "PREV_SCREEN";
        SKIP_FLOW: "SKIP_FLOW";
        OPEN_URL: "OPEN_URL";
        DEEP_LINK: "DEEP_LINK";
        CUSTOM_EVENT: "CUSTOM_EVENT";
        DISMISS: "DISMISS";
        CLOSE_FLOW: "CLOSE_FLOW";
        REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
        REQUEST_TRACKING: "REQUEST_TRACKING";
        RESTORE_PURCHASES: "RESTORE_PURCHASES";
    }>;
    actionTarget: z.ZodOptional<z.ZodEnum<{
        "": "";
        previous: "previous";
        first: "first";
        last: "last";
        specific: "specific";
    }>>;
    actionTargetScreenId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    url: z.ZodOptional<z.ZodString>;
    deepLinkUrl: z.ZodOptional<z.ZodString>;
    eventName: z.ZodOptional<z.ZodString>;
    showIcon: z.ZodOptional<z.ZodBoolean>;
    iconName: z.ZodOptional<z.ZodString>;
    iconPosition: z.ZodOptional<z.ZodEnum<{
        left: "left";
        right: "right";
        only: "only";
    }>>;
    iconSize: z.ZodOptional<z.ZodNumber>;
    iconColor: z.ZodOptional<z.ZodString>;
    iconSpacing: z.ZodOptional<z.ZodNumber>;
    style: z.ZodOptional<z.ZodObject<{
        backgroundColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
        borderRadius: z.ZodOptional<z.ZodNumber>;
        borderColor: z.ZodOptional<z.ZodString>;
        borderWidth: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const textInputPropsSchema: z.ZodObject<{
    placeholder: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    fieldKey: z.ZodString;
    required: z.ZodOptional<z.ZodBoolean>;
    keyboardType: z.ZodOptional<z.ZodEnum<{
        default: "default";
        email: "email";
        numeric: "numeric";
        phone: "phone";
    }>>;
    maxLength: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const selectOptionSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    iconName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const multiSelectPropsSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    fieldKey: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        iconName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    minSelections: z.ZodOptional<z.ZodNumber>;
    maxSelections: z.ZodOptional<z.ZodNumber>;
    required: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const singleSelectPropsSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    fieldKey: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        iconName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    required: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const sliderPropsSchema: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    fieldKey: z.ZodString;
    min: z.ZodNumber;
    max: z.ZodNumber;
    step: z.ZodOptional<z.ZodNumber>;
    defaultValue: z.ZodOptional<z.ZodNumber>;
    minLabel: z.ZodOptional<z.ZodString>;
    maxLabel: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const progressBarPropsSchema: z.ZodObject<{
    color: z.ZodOptional<z.ZodString>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    height: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const pageIndicatorPropsSchema: z.ZodObject<{
    activeColor: z.ZodOptional<z.ZodString>;
    inactiveColor: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const stackPropsSchema: z.ZodObject<{
    direction: z.ZodOptional<z.ZodEnum<{
        vertical: "vertical";
        horizontal: "horizontal";
    }>>;
    gap: z.ZodOptional<z.ZodNumber>;
    padding: z.ZodOptional<z.ZodNumber>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    borderRadius: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export declare const footerPropsSchema: z.ZodObject<{
    text: z.ZodString;
    textColor: z.ZodOptional<z.ZodString>;
    fontSize: z.ZodOptional<z.ZodNumber>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    showDivider: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const tabButtonPropsSchema: z.ZodObject<{
    tabs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        active: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    activeColor: z.ZodOptional<z.ZodString>;
    inactiveColor: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const carouselPropsSchema: z.ZodObject<{
    variant: z.ZodOptional<z.ZodEnum<{
        image: "image";
        card: "card";
    }>>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        imageSrc: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    height: z.ZodOptional<z.ZodNumber>;
    borderRadius: z.ZodOptional<z.ZodNumber>;
    showDots: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const socialProofPropsSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    totalReviews: z.ZodOptional<z.ZodNumber>;
    reviews: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        author: z.ZodString;
        rating: z.ZodNumber;
        text: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    showStars: z.ZodOptional<z.ZodBoolean>;
    compact: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const featureListPropsSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    features: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
    }, z.core.$strip>>;
    iconColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const awardPropsSchema: z.ZodObject<{
    variant: z.ZodOptional<z.ZodEnum<{
        badge: "badge";
        laurel: "laurel";
        minimal: "minimal";
    }>>;
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    issuer: z.ZodOptional<z.ZodString>;
    iconSrc: z.ZodOptional<z.ZodString>;
    showLaurels: z.ZodOptional<z.ZodBoolean>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    textColor: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const customComponentPropsSchema: z.ZodObject<{
    registryKey: z.ZodString;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$loose>;
export declare const componentConstraintsSchema: z.ZodObject<{
    horizontal: z.ZodOptional<z.ZodEnum<{
        center: "center";
        min: "min";
        max: "max";
        stretch: "stretch";
    }>>;
    vertical: z.ZodOptional<z.ZodEnum<{
        center: "center";
        min: "min";
        max: "max";
        stretch: "stretch";
    }>>;
    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const componentLayoutSchema: z.ZodObject<{
    position: z.ZodOptional<z.ZodEnum<{
        flow: "flow";
        absolute: "absolute";
    }>>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    rotation: z.ZodOptional<z.ZodNumber>;
    zIndex: z.ZodOptional<z.ZodNumber>;
    visible: z.ZodOptional<z.ZodBoolean>;
    locked: z.ZodOptional<z.ZodBoolean>;
    constraints: z.ZodOptional<z.ZodObject<{
        horizontal: z.ZodOptional<z.ZodEnum<{
            center: "center";
            min: "min";
            max: "max";
            stretch: "stretch";
        }>>;
        vertical: z.ZodOptional<z.ZodEnum<{
            center: "center";
            min: "min";
            max: "max";
            stretch: "stretch";
        }>>;
        keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$loose>;
export declare const flowComponentSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"TEXT">;
    props: z.ZodObject<{
        content: z.ZodString;
        fontSize: z.ZodOptional<z.ZodNumber>;
        fontWeight: z.ZodOptional<z.ZodEnum<{
            normal: "normal";
            medium: "medium";
            semibold: "semibold";
            bold: "bold";
        }>>;
        color: z.ZodOptional<z.ZodString>;
        textAlign: z.ZodOptional<z.ZodEnum<{
            left: "left";
            center: "center";
            right: "right";
        }>>;
        lineHeight: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"IMAGE">;
    props: z.ZodObject<{
        src: z.ZodString;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        borderRadius: z.ZodOptional<z.ZodNumber>;
        resizeMode: z.ZodOptional<z.ZodEnum<{
            center: "center";
            stretch: "stretch";
            cover: "cover";
            contain: "contain";
        }>>;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"LOTTIE">;
    props: z.ZodObject<{
        src: z.ZodString;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        autoPlay: z.ZodOptional<z.ZodBoolean>;
        loop: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"VIDEO">;
    props: z.ZodObject<{
        src: z.ZodString;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        autoPlay: z.ZodOptional<z.ZodBoolean>;
        loop: z.ZodOptional<z.ZodBoolean>;
        muted: z.ZodOptional<z.ZodBoolean>;
        posterUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"ICON">;
    props: z.ZodObject<{
        name: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"ICON_LIBRARY">;
    props: z.ZodObject<{
        iconName: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
        color: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        opacity: z.ZodOptional<z.ZodNumber>;
        paddingVertical: z.ZodOptional<z.ZodNumber>;
        paddingHorizontal: z.ZodOptional<z.ZodNumber>;
        marginVertical: z.ZodOptional<z.ZodNumber>;
        marginHorizontal: z.ZodOptional<z.ZodNumber>;
        backgroundColor: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"BUTTON">;
    props: z.ZodObject<{
        label: z.ZodString;
        action: z.ZodEnum<{
            NEXT_SCREEN: "NEXT_SCREEN";
            PREV_SCREEN: "PREV_SCREEN";
            SKIP_FLOW: "SKIP_FLOW";
            OPEN_URL: "OPEN_URL";
            DEEP_LINK: "DEEP_LINK";
            CUSTOM_EVENT: "CUSTOM_EVENT";
            DISMISS: "DISMISS";
            CLOSE_FLOW: "CLOSE_FLOW";
            REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
            REQUEST_TRACKING: "REQUEST_TRACKING";
            RESTORE_PURCHASES: "RESTORE_PURCHASES";
        }>;
        actionTarget: z.ZodOptional<z.ZodEnum<{
            "": "";
            previous: "previous";
            first: "first";
            last: "last";
            specific: "specific";
        }>>;
        actionTargetScreenId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        url: z.ZodOptional<z.ZodString>;
        deepLinkUrl: z.ZodOptional<z.ZodString>;
        eventName: z.ZodOptional<z.ZodString>;
        showIcon: z.ZodOptional<z.ZodBoolean>;
        iconName: z.ZodOptional<z.ZodString>;
        iconPosition: z.ZodOptional<z.ZodEnum<{
            left: "left";
            right: "right";
            only: "only";
        }>>;
        iconSize: z.ZodOptional<z.ZodNumber>;
        iconColor: z.ZodOptional<z.ZodString>;
        iconSpacing: z.ZodOptional<z.ZodNumber>;
        style: z.ZodOptional<z.ZodObject<{
            backgroundColor: z.ZodOptional<z.ZodString>;
            textColor: z.ZodOptional<z.ZodString>;
            borderRadius: z.ZodOptional<z.ZodNumber>;
            borderColor: z.ZodOptional<z.ZodString>;
            borderWidth: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"TEXT_INPUT">;
    props: z.ZodObject<{
        placeholder: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        fieldKey: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        keyboardType: z.ZodOptional<z.ZodEnum<{
            default: "default";
            email: "email";
            numeric: "numeric";
            phone: "phone";
        }>>;
        maxLength: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"MULTI_SELECT">;
    props: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        fieldKey: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            iconName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        minSelections: z.ZodOptional<z.ZodNumber>;
        maxSelections: z.ZodOptional<z.ZodNumber>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"SINGLE_SELECT">;
    props: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        fieldKey: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            iconName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        required: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"SLIDER">;
    props: z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        fieldKey: z.ZodString;
        min: z.ZodNumber;
        max: z.ZodNumber;
        step: z.ZodOptional<z.ZodNumber>;
        defaultValue: z.ZodOptional<z.ZodNumber>;
        minLabel: z.ZodOptional<z.ZodString>;
        maxLabel: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"PROGRESS_BAR">;
    props: z.ZodObject<{
        color: z.ZodOptional<z.ZodString>;
        backgroundColor: z.ZodOptional<z.ZodString>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"PAGE_INDICATOR">;
    props: z.ZodObject<{
        activeColor: z.ZodOptional<z.ZodString>;
        inactiveColor: z.ZodOptional<z.ZodString>;
        size: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"STACK">;
    props: z.ZodObject<{
        direction: z.ZodOptional<z.ZodEnum<{
            vertical: "vertical";
            horizontal: "horizontal";
        }>>;
        gap: z.ZodOptional<z.ZodNumber>;
        padding: z.ZodOptional<z.ZodNumber>;
        backgroundColor: z.ZodOptional<z.ZodString>;
        borderRadius: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"FOOTER">;
    props: z.ZodObject<{
        text: z.ZodString;
        textColor: z.ZodOptional<z.ZodString>;
        fontSize: z.ZodOptional<z.ZodNumber>;
        backgroundColor: z.ZodOptional<z.ZodString>;
        showDivider: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"TAB_BUTTON">;
    props: z.ZodObject<{
        tabs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            active: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
        activeColor: z.ZodOptional<z.ZodString>;
        inactiveColor: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"CAROUSEL">;
    props: z.ZodObject<{
        variant: z.ZodOptional<z.ZodEnum<{
            image: "image";
            card: "card";
        }>>;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            imageSrc: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            subtitle: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        height: z.ZodOptional<z.ZodNumber>;
        borderRadius: z.ZodOptional<z.ZodNumber>;
        showDots: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"SOCIAL_PROOF">;
    props: z.ZodObject<{
        rating: z.ZodOptional<z.ZodNumber>;
        totalReviews: z.ZodOptional<z.ZodNumber>;
        reviews: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            author: z.ZodString;
            rating: z.ZodNumber;
            text: z.ZodOptional<z.ZodString>;
            avatar: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        showStars: z.ZodOptional<z.ZodBoolean>;
        compact: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"FEATURE_LIST">;
    props: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        features: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            icon: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
        }, z.core.$strip>>;
        iconColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"AWARD">;
    props: z.ZodObject<{
        variant: z.ZodOptional<z.ZodEnum<{
            badge: "badge";
            laurel: "laurel";
            minimal: "minimal";
        }>>;
        title: z.ZodString;
        subtitle: z.ZodOptional<z.ZodString>;
        issuer: z.ZodOptional<z.ZodString>;
        iconSrc: z.ZodOptional<z.ZodString>;
        showLaurels: z.ZodOptional<z.ZodBoolean>;
        backgroundColor: z.ZodOptional<z.ZodString>;
        textColor: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    order: z.ZodNumber;
    layout: z.ZodOptional<z.ZodObject<{
        position: z.ZodOptional<z.ZodEnum<{
            flow: "flow";
            absolute: "absolute";
        }>>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        rotation: z.ZodOptional<z.ZodNumber>;
        zIndex: z.ZodOptional<z.ZodNumber>;
        visible: z.ZodOptional<z.ZodBoolean>;
        locked: z.ZodOptional<z.ZodBoolean>;
        constraints: z.ZodOptional<z.ZodObject<{
            horizontal: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            vertical: z.ZodOptional<z.ZodEnum<{
                center: "center";
                min: "min";
                max: "max";
                stretch: "stretch";
            }>>;
            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
    type: z.ZodLiteral<"CUSTOM_COMPONENT">;
    props: z.ZodObject<{
        registryKey: z.ZodString;
        payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$loose>;
}, z.core.$strip>], "type">;
export declare const branchRuleSchema: z.ZodObject<{
    id: z.ZodString;
    fieldKey: z.ZodString;
    operator: z.ZodEnum<{
        equals: "equals";
        not_equals: "not_equals";
        contains: "contains";
        not_contains: "not_contains";
        is_set: "is_set";
        is_not_set: "is_not_set";
    }>;
    value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    targetScreenId: z.ZodString;
}, z.core.$strip>;
export declare const skipConditionSchema: z.ZodObject<{
    id: z.ZodString;
    fieldKey: z.ZodString;
    operator: z.ZodEnum<{
        equals: "equals";
        not_equals: "not_equals";
        contains: "contains";
        not_contains: "not_contains";
        is_set: "is_set";
        is_not_set: "is_not_set";
    }>;
    value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
}, z.core.$strip>;
export declare const screenStyleSchema: z.ZodObject<{
    backgroundColor: z.ZodOptional<z.ZodString>;
    backgroundImage: z.ZodOptional<z.ZodString>;
    padding: z.ZodOptional<z.ZodNumber>;
    paddingTop: z.ZodOptional<z.ZodNumber>;
    paddingBottom: z.ZodOptional<z.ZodNumber>;
    paddingHorizontal: z.ZodOptional<z.ZodNumber>;
    justifyContent: z.ZodOptional<z.ZodEnum<{
        center: "center";
        "flex-start": "flex-start";
        "flex-end": "flex-end";
        "space-between": "space-between";
        "space-around": "space-around";
    }>>;
    alignItems: z.ZodOptional<z.ZodEnum<{
        center: "center";
        stretch: "stretch";
        "flex-start": "flex-start";
        "flex-end": "flex-end";
    }>>;
}, z.core.$loose>;
export declare const screenSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    order: z.ZodNumber;
    layoutMode: z.ZodOptional<z.ZodEnum<{
        absolute: "absolute";
        auto: "auto";
    }>>;
    style: z.ZodOptional<z.ZodObject<{
        backgroundColor: z.ZodOptional<z.ZodString>;
        backgroundImage: z.ZodOptional<z.ZodString>;
        padding: z.ZodOptional<z.ZodNumber>;
        paddingTop: z.ZodOptional<z.ZodNumber>;
        paddingBottom: z.ZodOptional<z.ZodNumber>;
        paddingHorizontal: z.ZodOptional<z.ZodNumber>;
        justifyContent: z.ZodOptional<z.ZodEnum<{
            center: "center";
            "flex-start": "flex-start";
            "flex-end": "flex-end";
            "space-between": "space-between";
            "space-around": "space-around";
        }>>;
        alignItems: z.ZodOptional<z.ZodEnum<{
            center: "center";
            stretch: "stretch";
            "flex-start": "flex-start";
            "flex-end": "flex-end";
        }>>;
    }, z.core.$loose>>;
    customScreenKey: z.ZodOptional<z.ZodString>;
    customPayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    components: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"TEXT">;
        props: z.ZodObject<{
            content: z.ZodString;
            fontSize: z.ZodOptional<z.ZodNumber>;
            fontWeight: z.ZodOptional<z.ZodEnum<{
                normal: "normal";
                medium: "medium";
                semibold: "semibold";
                bold: "bold";
            }>>;
            color: z.ZodOptional<z.ZodString>;
            textAlign: z.ZodOptional<z.ZodEnum<{
                left: "left";
                center: "center";
                right: "right";
            }>>;
            lineHeight: z.ZodOptional<z.ZodNumber>;
            opacity: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"IMAGE">;
        props: z.ZodObject<{
            src: z.ZodString;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            borderRadius: z.ZodOptional<z.ZodNumber>;
            resizeMode: z.ZodOptional<z.ZodEnum<{
                center: "center";
                stretch: "stretch";
                cover: "cover";
                contain: "contain";
            }>>;
            alt: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"LOTTIE">;
        props: z.ZodObject<{
            src: z.ZodString;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            autoPlay: z.ZodOptional<z.ZodBoolean>;
            loop: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"VIDEO">;
        props: z.ZodObject<{
            src: z.ZodString;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            autoPlay: z.ZodOptional<z.ZodBoolean>;
            loop: z.ZodOptional<z.ZodBoolean>;
            muted: z.ZodOptional<z.ZodBoolean>;
            posterUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"ICON">;
        props: z.ZodObject<{
            name: z.ZodString;
            size: z.ZodOptional<z.ZodNumber>;
            color: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"ICON_LIBRARY">;
        props: z.ZodObject<{
            iconName: z.ZodString;
            size: z.ZodOptional<z.ZodNumber>;
            color: z.ZodOptional<z.ZodString>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            opacity: z.ZodOptional<z.ZodNumber>;
            paddingVertical: z.ZodOptional<z.ZodNumber>;
            paddingHorizontal: z.ZodOptional<z.ZodNumber>;
            marginVertical: z.ZodOptional<z.ZodNumber>;
            marginHorizontal: z.ZodOptional<z.ZodNumber>;
            backgroundColor: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"BUTTON">;
        props: z.ZodObject<{
            label: z.ZodString;
            action: z.ZodEnum<{
                NEXT_SCREEN: "NEXT_SCREEN";
                PREV_SCREEN: "PREV_SCREEN";
                SKIP_FLOW: "SKIP_FLOW";
                OPEN_URL: "OPEN_URL";
                DEEP_LINK: "DEEP_LINK";
                CUSTOM_EVENT: "CUSTOM_EVENT";
                DISMISS: "DISMISS";
                CLOSE_FLOW: "CLOSE_FLOW";
                REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
                REQUEST_TRACKING: "REQUEST_TRACKING";
                RESTORE_PURCHASES: "RESTORE_PURCHASES";
            }>;
            actionTarget: z.ZodOptional<z.ZodEnum<{
                "": "";
                previous: "previous";
                first: "first";
                last: "last";
                specific: "specific";
            }>>;
            actionTargetScreenId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            url: z.ZodOptional<z.ZodString>;
            deepLinkUrl: z.ZodOptional<z.ZodString>;
            eventName: z.ZodOptional<z.ZodString>;
            showIcon: z.ZodOptional<z.ZodBoolean>;
            iconName: z.ZodOptional<z.ZodString>;
            iconPosition: z.ZodOptional<z.ZodEnum<{
                left: "left";
                right: "right";
                only: "only";
            }>>;
            iconSize: z.ZodOptional<z.ZodNumber>;
            iconColor: z.ZodOptional<z.ZodString>;
            iconSpacing: z.ZodOptional<z.ZodNumber>;
            style: z.ZodOptional<z.ZodObject<{
                backgroundColor: z.ZodOptional<z.ZodString>;
                textColor: z.ZodOptional<z.ZodString>;
                borderRadius: z.ZodOptional<z.ZodNumber>;
                borderColor: z.ZodOptional<z.ZodString>;
                borderWidth: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"TEXT_INPUT">;
        props: z.ZodObject<{
            placeholder: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
            fieldKey: z.ZodString;
            required: z.ZodOptional<z.ZodBoolean>;
            keyboardType: z.ZodOptional<z.ZodEnum<{
                default: "default";
                email: "email";
                numeric: "numeric";
                phone: "phone";
            }>>;
            maxLength: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"MULTI_SELECT">;
        props: z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            fieldKey: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                iconName: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            minSelections: z.ZodOptional<z.ZodNumber>;
            maxSelections: z.ZodOptional<z.ZodNumber>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"SINGLE_SELECT">;
        props: z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            fieldKey: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                iconName: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            required: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"SLIDER">;
        props: z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            fieldKey: z.ZodString;
            min: z.ZodNumber;
            max: z.ZodNumber;
            step: z.ZodOptional<z.ZodNumber>;
            defaultValue: z.ZodOptional<z.ZodNumber>;
            minLabel: z.ZodOptional<z.ZodString>;
            maxLabel: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"PROGRESS_BAR">;
        props: z.ZodObject<{
            color: z.ZodOptional<z.ZodString>;
            backgroundColor: z.ZodOptional<z.ZodString>;
            height: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"PAGE_INDICATOR">;
        props: z.ZodObject<{
            activeColor: z.ZodOptional<z.ZodString>;
            inactiveColor: z.ZodOptional<z.ZodString>;
            size: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"STACK">;
        props: z.ZodObject<{
            direction: z.ZodOptional<z.ZodEnum<{
                vertical: "vertical";
                horizontal: "horizontal";
            }>>;
            gap: z.ZodOptional<z.ZodNumber>;
            padding: z.ZodOptional<z.ZodNumber>;
            backgroundColor: z.ZodOptional<z.ZodString>;
            borderRadius: z.ZodOptional<z.ZodNumber>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"FOOTER">;
        props: z.ZodObject<{
            text: z.ZodString;
            textColor: z.ZodOptional<z.ZodString>;
            fontSize: z.ZodOptional<z.ZodNumber>;
            backgroundColor: z.ZodOptional<z.ZodString>;
            showDivider: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"TAB_BUTTON">;
        props: z.ZodObject<{
            tabs: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                active: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
            activeColor: z.ZodOptional<z.ZodString>;
            inactiveColor: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"CAROUSEL">;
        props: z.ZodObject<{
            variant: z.ZodOptional<z.ZodEnum<{
                image: "image";
                card: "card";
            }>>;
            items: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                imageSrc: z.ZodOptional<z.ZodString>;
                title: z.ZodOptional<z.ZodString>;
                subtitle: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            height: z.ZodOptional<z.ZodNumber>;
            borderRadius: z.ZodOptional<z.ZodNumber>;
            showDots: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"SOCIAL_PROOF">;
        props: z.ZodObject<{
            rating: z.ZodOptional<z.ZodNumber>;
            totalReviews: z.ZodOptional<z.ZodNumber>;
            reviews: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                author: z.ZodString;
                rating: z.ZodNumber;
                text: z.ZodOptional<z.ZodString>;
                avatar: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
            showStars: z.ZodOptional<z.ZodBoolean>;
            compact: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"FEATURE_LIST">;
        props: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            features: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                icon: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
            }, z.core.$strip>>;
            iconColor: z.ZodOptional<z.ZodString>;
            textColor: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"AWARD">;
        props: z.ZodObject<{
            variant: z.ZodOptional<z.ZodEnum<{
                badge: "badge";
                laurel: "laurel";
                minimal: "minimal";
            }>>;
            title: z.ZodString;
            subtitle: z.ZodOptional<z.ZodString>;
            issuer: z.ZodOptional<z.ZodString>;
            iconSrc: z.ZodOptional<z.ZodString>;
            showLaurels: z.ZodOptional<z.ZodBoolean>;
            backgroundColor: z.ZodOptional<z.ZodString>;
            textColor: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        order: z.ZodNumber;
        layout: z.ZodOptional<z.ZodObject<{
            position: z.ZodOptional<z.ZodEnum<{
                flow: "flow";
                absolute: "absolute";
            }>>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            rotation: z.ZodOptional<z.ZodNumber>;
            zIndex: z.ZodOptional<z.ZodNumber>;
            visible: z.ZodOptional<z.ZodBoolean>;
            locked: z.ZodOptional<z.ZodBoolean>;
            constraints: z.ZodOptional<z.ZodObject<{
                horizontal: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                vertical: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    min: "min";
                    max: "max";
                    stretch: "stretch";
                }>>;
                keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$loose>>;
        type: z.ZodLiteral<"CUSTOM_COMPONENT">;
        props: z.ZodObject<{
            registryKey: z.ZodString;
            payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$loose>;
    }, z.core.$strip>], "type">>;
    branchRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fieldKey: z.ZodString;
        operator: z.ZodEnum<{
            equals: "equals";
            not_equals: "not_equals";
            contains: "contains";
            not_contains: "not_contains";
            is_set: "is_set";
            is_not_set: "is_not_set";
        }>;
        value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        targetScreenId: z.ZodString;
    }, z.core.$strip>>>;
    skipWhen: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fieldKey: z.ZodString;
        operator: z.ZodEnum<{
            equals: "equals";
            not_equals: "not_equals";
            contains: "contains";
            not_contains: "not_contains";
            is_set: "is_set";
            is_not_set: "is_not_set";
        }>;
        value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
    }, z.core.$strip>>>;
}, z.core.$loose>;
export declare const flowSettingsSchema: z.ZodObject<{
    dismissible: z.ZodOptional<z.ZodBoolean>;
    showProgressBar: z.ZodOptional<z.ZodBoolean>;
    progressBarColor: z.ZodOptional<z.ZodString>;
    transitionAnimation: z.ZodOptional<z.ZodEnum<{
        slide: "slide";
        fade: "fade";
        none: "none";
    }>>;
    showBackButton: z.ZodOptional<z.ZodBoolean>;
    showSkipButton: z.ZodOptional<z.ZodBoolean>;
    skipButtonLabel: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const flowConfigSchema: z.ZodObject<{
    screens: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        order: z.ZodNumber;
        layoutMode: z.ZodOptional<z.ZodEnum<{
            absolute: "absolute";
            auto: "auto";
        }>>;
        style: z.ZodOptional<z.ZodObject<{
            backgroundColor: z.ZodOptional<z.ZodString>;
            backgroundImage: z.ZodOptional<z.ZodString>;
            padding: z.ZodOptional<z.ZodNumber>;
            paddingTop: z.ZodOptional<z.ZodNumber>;
            paddingBottom: z.ZodOptional<z.ZodNumber>;
            paddingHorizontal: z.ZodOptional<z.ZodNumber>;
            justifyContent: z.ZodOptional<z.ZodEnum<{
                center: "center";
                "flex-start": "flex-start";
                "flex-end": "flex-end";
                "space-between": "space-between";
                "space-around": "space-around";
            }>>;
            alignItems: z.ZodOptional<z.ZodEnum<{
                center: "center";
                stretch: "stretch";
                "flex-start": "flex-start";
                "flex-end": "flex-end";
            }>>;
        }, z.core.$loose>>;
        customScreenKey: z.ZodOptional<z.ZodString>;
        customPayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        components: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"TEXT">;
            props: z.ZodObject<{
                content: z.ZodString;
                fontSize: z.ZodOptional<z.ZodNumber>;
                fontWeight: z.ZodOptional<z.ZodEnum<{
                    normal: "normal";
                    medium: "medium";
                    semibold: "semibold";
                    bold: "bold";
                }>>;
                color: z.ZodOptional<z.ZodString>;
                textAlign: z.ZodOptional<z.ZodEnum<{
                    left: "left";
                    center: "center";
                    right: "right";
                }>>;
                lineHeight: z.ZodOptional<z.ZodNumber>;
                opacity: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"IMAGE">;
            props: z.ZodObject<{
                src: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                borderRadius: z.ZodOptional<z.ZodNumber>;
                resizeMode: z.ZodOptional<z.ZodEnum<{
                    center: "center";
                    stretch: "stretch";
                    cover: "cover";
                    contain: "contain";
                }>>;
                alt: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"LOTTIE">;
            props: z.ZodObject<{
                src: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                autoPlay: z.ZodOptional<z.ZodBoolean>;
                loop: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"VIDEO">;
            props: z.ZodObject<{
                src: z.ZodString;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                autoPlay: z.ZodOptional<z.ZodBoolean>;
                loop: z.ZodOptional<z.ZodBoolean>;
                muted: z.ZodOptional<z.ZodBoolean>;
                posterUrl: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"ICON">;
            props: z.ZodObject<{
                name: z.ZodString;
                size: z.ZodOptional<z.ZodNumber>;
                color: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"ICON_LIBRARY">;
            props: z.ZodObject<{
                iconName: z.ZodString;
                size: z.ZodOptional<z.ZodNumber>;
                color: z.ZodOptional<z.ZodString>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                opacity: z.ZodOptional<z.ZodNumber>;
                paddingVertical: z.ZodOptional<z.ZodNumber>;
                paddingHorizontal: z.ZodOptional<z.ZodNumber>;
                marginVertical: z.ZodOptional<z.ZodNumber>;
                marginHorizontal: z.ZodOptional<z.ZodNumber>;
                backgroundColor: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"BUTTON">;
            props: z.ZodObject<{
                label: z.ZodString;
                action: z.ZodEnum<{
                    NEXT_SCREEN: "NEXT_SCREEN";
                    PREV_SCREEN: "PREV_SCREEN";
                    SKIP_FLOW: "SKIP_FLOW";
                    OPEN_URL: "OPEN_URL";
                    DEEP_LINK: "DEEP_LINK";
                    CUSTOM_EVENT: "CUSTOM_EVENT";
                    DISMISS: "DISMISS";
                    CLOSE_FLOW: "CLOSE_FLOW";
                    REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
                    REQUEST_TRACKING: "REQUEST_TRACKING";
                    RESTORE_PURCHASES: "RESTORE_PURCHASES";
                }>;
                actionTarget: z.ZodOptional<z.ZodEnum<{
                    "": "";
                    previous: "previous";
                    first: "first";
                    last: "last";
                    specific: "specific";
                }>>;
                actionTargetScreenId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
                url: z.ZodOptional<z.ZodString>;
                deepLinkUrl: z.ZodOptional<z.ZodString>;
                eventName: z.ZodOptional<z.ZodString>;
                showIcon: z.ZodOptional<z.ZodBoolean>;
                iconName: z.ZodOptional<z.ZodString>;
                iconPosition: z.ZodOptional<z.ZodEnum<{
                    left: "left";
                    right: "right";
                    only: "only";
                }>>;
                iconSize: z.ZodOptional<z.ZodNumber>;
                iconColor: z.ZodOptional<z.ZodString>;
                iconSpacing: z.ZodOptional<z.ZodNumber>;
                style: z.ZodOptional<z.ZodObject<{
                    backgroundColor: z.ZodOptional<z.ZodString>;
                    textColor: z.ZodOptional<z.ZodString>;
                    borderRadius: z.ZodOptional<z.ZodNumber>;
                    borderColor: z.ZodOptional<z.ZodString>;
                    borderWidth: z.ZodOptional<z.ZodNumber>;
                }, z.core.$loose>>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"TEXT_INPUT">;
            props: z.ZodObject<{
                placeholder: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                fieldKey: z.ZodString;
                required: z.ZodOptional<z.ZodBoolean>;
                keyboardType: z.ZodOptional<z.ZodEnum<{
                    default: "default";
                    email: "email";
                    numeric: "numeric";
                    phone: "phone";
                }>>;
                maxLength: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"MULTI_SELECT">;
            props: z.ZodObject<{
                label: z.ZodOptional<z.ZodString>;
                fieldKey: z.ZodString;
                options: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    iconName: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>;
                minSelections: z.ZodOptional<z.ZodNumber>;
                maxSelections: z.ZodOptional<z.ZodNumber>;
                required: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"SINGLE_SELECT">;
            props: z.ZodObject<{
                label: z.ZodOptional<z.ZodString>;
                fieldKey: z.ZodString;
                options: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    iconName: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>;
                required: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"SLIDER">;
            props: z.ZodObject<{
                label: z.ZodOptional<z.ZodString>;
                fieldKey: z.ZodString;
                min: z.ZodNumber;
                max: z.ZodNumber;
                step: z.ZodOptional<z.ZodNumber>;
                defaultValue: z.ZodOptional<z.ZodNumber>;
                minLabel: z.ZodOptional<z.ZodString>;
                maxLabel: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"PROGRESS_BAR">;
            props: z.ZodObject<{
                color: z.ZodOptional<z.ZodString>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                height: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"PAGE_INDICATOR">;
            props: z.ZodObject<{
                activeColor: z.ZodOptional<z.ZodString>;
                inactiveColor: z.ZodOptional<z.ZodString>;
                size: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"STACK">;
            props: z.ZodObject<{
                direction: z.ZodOptional<z.ZodEnum<{
                    vertical: "vertical";
                    horizontal: "horizontal";
                }>>;
                gap: z.ZodOptional<z.ZodNumber>;
                padding: z.ZodOptional<z.ZodNumber>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                borderRadius: z.ZodOptional<z.ZodNumber>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"FOOTER">;
            props: z.ZodObject<{
                text: z.ZodString;
                textColor: z.ZodOptional<z.ZodString>;
                fontSize: z.ZodOptional<z.ZodNumber>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                showDivider: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"TAB_BUTTON">;
            props: z.ZodObject<{
                tabs: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    active: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
                activeColor: z.ZodOptional<z.ZodString>;
                inactiveColor: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"CAROUSEL">;
            props: z.ZodObject<{
                variant: z.ZodOptional<z.ZodEnum<{
                    image: "image";
                    card: "card";
                }>>;
                items: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    imageSrc: z.ZodOptional<z.ZodString>;
                    title: z.ZodOptional<z.ZodString>;
                    subtitle: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>;
                height: z.ZodOptional<z.ZodNumber>;
                borderRadius: z.ZodOptional<z.ZodNumber>;
                showDots: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"SOCIAL_PROOF">;
            props: z.ZodObject<{
                rating: z.ZodOptional<z.ZodNumber>;
                totalReviews: z.ZodOptional<z.ZodNumber>;
                reviews: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    author: z.ZodString;
                    rating: z.ZodNumber;
                    text: z.ZodOptional<z.ZodString>;
                    avatar: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>>;
                showStars: z.ZodOptional<z.ZodBoolean>;
                compact: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"FEATURE_LIST">;
            props: z.ZodObject<{
                title: z.ZodOptional<z.ZodString>;
                features: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    icon: z.ZodOptional<z.ZodString>;
                    label: z.ZodString;
                }, z.core.$strip>>;
                iconColor: z.ZodOptional<z.ZodString>;
                textColor: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"AWARD">;
            props: z.ZodObject<{
                variant: z.ZodOptional<z.ZodEnum<{
                    badge: "badge";
                    laurel: "laurel";
                    minimal: "minimal";
                }>>;
                title: z.ZodString;
                subtitle: z.ZodOptional<z.ZodString>;
                issuer: z.ZodOptional<z.ZodString>;
                iconSrc: z.ZodOptional<z.ZodString>;
                showLaurels: z.ZodOptional<z.ZodBoolean>;
                backgroundColor: z.ZodOptional<z.ZodString>;
                textColor: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>;
        }, z.core.$strip>, z.ZodObject<{
            id: z.ZodString;
            order: z.ZodNumber;
            layout: z.ZodOptional<z.ZodObject<{
                position: z.ZodOptional<z.ZodEnum<{
                    flow: "flow";
                    absolute: "absolute";
                }>>;
                x: z.ZodOptional<z.ZodNumber>;
                y: z.ZodOptional<z.ZodNumber>;
                width: z.ZodOptional<z.ZodNumber>;
                height: z.ZodOptional<z.ZodNumber>;
                rotation: z.ZodOptional<z.ZodNumber>;
                zIndex: z.ZodOptional<z.ZodNumber>;
                visible: z.ZodOptional<z.ZodBoolean>;
                locked: z.ZodOptional<z.ZodBoolean>;
                constraints: z.ZodOptional<z.ZodObject<{
                    horizontal: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    vertical: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        min: "min";
                        max: "max";
                        stretch: "stretch";
                    }>>;
                    keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                }, z.core.$strip>>;
            }, z.core.$loose>>;
            type: z.ZodLiteral<"CUSTOM_COMPONENT">;
            props: z.ZodObject<{
                registryKey: z.ZodString;
                payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$loose>;
        }, z.core.$strip>], "type">>;
        branchRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            fieldKey: z.ZodString;
            operator: z.ZodEnum<{
                equals: "equals";
                not_equals: "not_equals";
                contains: "contains";
                not_contains: "not_contains";
                is_set: "is_set";
                is_not_set: "is_not_set";
            }>;
            value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
            targetScreenId: z.ZodString;
        }, z.core.$strip>>>;
        skipWhen: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            fieldKey: z.ZodString;
            operator: z.ZodEnum<{
                equals: "equals";
                not_equals: "not_equals";
                contains: "contains";
                not_contains: "not_contains";
                is_set: "is_set";
                is_not_set: "is_not_set";
            }>;
            value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
        }, z.core.$strip>>>;
    }, z.core.$loose>>;
    settings: z.ZodOptional<z.ZodObject<{
        dismissible: z.ZodOptional<z.ZodBoolean>;
        showProgressBar: z.ZodOptional<z.ZodBoolean>;
        progressBarColor: z.ZodOptional<z.ZodString>;
        transitionAnimation: z.ZodOptional<z.ZodEnum<{
            slide: "slide";
            fade: "fade";
            none: "none";
        }>>;
        showBackButton: z.ZodOptional<z.ZodBoolean>;
        showSkipButton: z.ZodOptional<z.ZodBoolean>;
        skipButtonLabel: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
}, z.core.$loose>;
export declare const sdkFlowResponseSchema: z.ZodObject<{
    flow: z.ZodObject<{
        slug: z.ZodString;
        version: z.ZodNumber;
        config: z.ZodObject<{
            screens: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                order: z.ZodNumber;
                layoutMode: z.ZodOptional<z.ZodEnum<{
                    absolute: "absolute";
                    auto: "auto";
                }>>;
                style: z.ZodOptional<z.ZodObject<{
                    backgroundColor: z.ZodOptional<z.ZodString>;
                    backgroundImage: z.ZodOptional<z.ZodString>;
                    padding: z.ZodOptional<z.ZodNumber>;
                    paddingTop: z.ZodOptional<z.ZodNumber>;
                    paddingBottom: z.ZodOptional<z.ZodNumber>;
                    paddingHorizontal: z.ZodOptional<z.ZodNumber>;
                    justifyContent: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        "flex-start": "flex-start";
                        "flex-end": "flex-end";
                        "space-between": "space-between";
                        "space-around": "space-around";
                    }>>;
                    alignItems: z.ZodOptional<z.ZodEnum<{
                        center: "center";
                        stretch: "stretch";
                        "flex-start": "flex-start";
                        "flex-end": "flex-end";
                    }>>;
                }, z.core.$loose>>;
                customScreenKey: z.ZodOptional<z.ZodString>;
                customPayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                components: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"TEXT">;
                    props: z.ZodObject<{
                        content: z.ZodString;
                        fontSize: z.ZodOptional<z.ZodNumber>;
                        fontWeight: z.ZodOptional<z.ZodEnum<{
                            normal: "normal";
                            medium: "medium";
                            semibold: "semibold";
                            bold: "bold";
                        }>>;
                        color: z.ZodOptional<z.ZodString>;
                        textAlign: z.ZodOptional<z.ZodEnum<{
                            left: "left";
                            center: "center";
                            right: "right";
                        }>>;
                        lineHeight: z.ZodOptional<z.ZodNumber>;
                        opacity: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"IMAGE">;
                    props: z.ZodObject<{
                        src: z.ZodString;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        borderRadius: z.ZodOptional<z.ZodNumber>;
                        resizeMode: z.ZodOptional<z.ZodEnum<{
                            center: "center";
                            stretch: "stretch";
                            cover: "cover";
                            contain: "contain";
                        }>>;
                        alt: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"LOTTIE">;
                    props: z.ZodObject<{
                        src: z.ZodString;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        autoPlay: z.ZodOptional<z.ZodBoolean>;
                        loop: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"VIDEO">;
                    props: z.ZodObject<{
                        src: z.ZodString;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        autoPlay: z.ZodOptional<z.ZodBoolean>;
                        loop: z.ZodOptional<z.ZodBoolean>;
                        muted: z.ZodOptional<z.ZodBoolean>;
                        posterUrl: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"ICON">;
                    props: z.ZodObject<{
                        name: z.ZodString;
                        size: z.ZodOptional<z.ZodNumber>;
                        color: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"ICON_LIBRARY">;
                    props: z.ZodObject<{
                        iconName: z.ZodString;
                        size: z.ZodOptional<z.ZodNumber>;
                        color: z.ZodOptional<z.ZodString>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        opacity: z.ZodOptional<z.ZodNumber>;
                        paddingVertical: z.ZodOptional<z.ZodNumber>;
                        paddingHorizontal: z.ZodOptional<z.ZodNumber>;
                        marginVertical: z.ZodOptional<z.ZodNumber>;
                        marginHorizontal: z.ZodOptional<z.ZodNumber>;
                        backgroundColor: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"BUTTON">;
                    props: z.ZodObject<{
                        label: z.ZodString;
                        action: z.ZodEnum<{
                            NEXT_SCREEN: "NEXT_SCREEN";
                            PREV_SCREEN: "PREV_SCREEN";
                            SKIP_FLOW: "SKIP_FLOW";
                            OPEN_URL: "OPEN_URL";
                            DEEP_LINK: "DEEP_LINK";
                            CUSTOM_EVENT: "CUSTOM_EVENT";
                            DISMISS: "DISMISS";
                            CLOSE_FLOW: "CLOSE_FLOW";
                            REQUEST_NOTIFICATIONS: "REQUEST_NOTIFICATIONS";
                            REQUEST_TRACKING: "REQUEST_TRACKING";
                            RESTORE_PURCHASES: "RESTORE_PURCHASES";
                        }>;
                        actionTarget: z.ZodOptional<z.ZodEnum<{
                            "": "";
                            previous: "previous";
                            first: "first";
                            last: "last";
                            specific: "specific";
                        }>>;
                        actionTargetScreenId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
                        url: z.ZodOptional<z.ZodString>;
                        deepLinkUrl: z.ZodOptional<z.ZodString>;
                        eventName: z.ZodOptional<z.ZodString>;
                        showIcon: z.ZodOptional<z.ZodBoolean>;
                        iconName: z.ZodOptional<z.ZodString>;
                        iconPosition: z.ZodOptional<z.ZodEnum<{
                            left: "left";
                            right: "right";
                            only: "only";
                        }>>;
                        iconSize: z.ZodOptional<z.ZodNumber>;
                        iconColor: z.ZodOptional<z.ZodString>;
                        iconSpacing: z.ZodOptional<z.ZodNumber>;
                        style: z.ZodOptional<z.ZodObject<{
                            backgroundColor: z.ZodOptional<z.ZodString>;
                            textColor: z.ZodOptional<z.ZodString>;
                            borderRadius: z.ZodOptional<z.ZodNumber>;
                            borderColor: z.ZodOptional<z.ZodString>;
                            borderWidth: z.ZodOptional<z.ZodNumber>;
                        }, z.core.$loose>>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"TEXT_INPUT">;
                    props: z.ZodObject<{
                        placeholder: z.ZodOptional<z.ZodString>;
                        label: z.ZodOptional<z.ZodString>;
                        fieldKey: z.ZodString;
                        required: z.ZodOptional<z.ZodBoolean>;
                        keyboardType: z.ZodOptional<z.ZodEnum<{
                            default: "default";
                            email: "email";
                            numeric: "numeric";
                            phone: "phone";
                        }>>;
                        maxLength: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"MULTI_SELECT">;
                    props: z.ZodObject<{
                        label: z.ZodOptional<z.ZodString>;
                        fieldKey: z.ZodString;
                        options: z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            label: z.ZodString;
                            iconName: z.ZodOptional<z.ZodString>;
                        }, z.core.$strip>>;
                        minSelections: z.ZodOptional<z.ZodNumber>;
                        maxSelections: z.ZodOptional<z.ZodNumber>;
                        required: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"SINGLE_SELECT">;
                    props: z.ZodObject<{
                        label: z.ZodOptional<z.ZodString>;
                        fieldKey: z.ZodString;
                        options: z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            label: z.ZodString;
                            iconName: z.ZodOptional<z.ZodString>;
                        }, z.core.$strip>>;
                        required: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"SLIDER">;
                    props: z.ZodObject<{
                        label: z.ZodOptional<z.ZodString>;
                        fieldKey: z.ZodString;
                        min: z.ZodNumber;
                        max: z.ZodNumber;
                        step: z.ZodOptional<z.ZodNumber>;
                        defaultValue: z.ZodOptional<z.ZodNumber>;
                        minLabel: z.ZodOptional<z.ZodString>;
                        maxLabel: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"PROGRESS_BAR">;
                    props: z.ZodObject<{
                        color: z.ZodOptional<z.ZodString>;
                        backgroundColor: z.ZodOptional<z.ZodString>;
                        height: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"PAGE_INDICATOR">;
                    props: z.ZodObject<{
                        activeColor: z.ZodOptional<z.ZodString>;
                        inactiveColor: z.ZodOptional<z.ZodString>;
                        size: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"STACK">;
                    props: z.ZodObject<{
                        direction: z.ZodOptional<z.ZodEnum<{
                            vertical: "vertical";
                            horizontal: "horizontal";
                        }>>;
                        gap: z.ZodOptional<z.ZodNumber>;
                        padding: z.ZodOptional<z.ZodNumber>;
                        backgroundColor: z.ZodOptional<z.ZodString>;
                        borderRadius: z.ZodOptional<z.ZodNumber>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"FOOTER">;
                    props: z.ZodObject<{
                        text: z.ZodString;
                        textColor: z.ZodOptional<z.ZodString>;
                        fontSize: z.ZodOptional<z.ZodNumber>;
                        backgroundColor: z.ZodOptional<z.ZodString>;
                        showDivider: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"TAB_BUTTON">;
                    props: z.ZodObject<{
                        tabs: z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            label: z.ZodString;
                            active: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                        activeColor: z.ZodOptional<z.ZodString>;
                        inactiveColor: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"CAROUSEL">;
                    props: z.ZodObject<{
                        variant: z.ZodOptional<z.ZodEnum<{
                            image: "image";
                            card: "card";
                        }>>;
                        items: z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            imageSrc: z.ZodOptional<z.ZodString>;
                            title: z.ZodOptional<z.ZodString>;
                            subtitle: z.ZodOptional<z.ZodString>;
                        }, z.core.$strip>>;
                        height: z.ZodOptional<z.ZodNumber>;
                        borderRadius: z.ZodOptional<z.ZodNumber>;
                        showDots: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"SOCIAL_PROOF">;
                    props: z.ZodObject<{
                        rating: z.ZodOptional<z.ZodNumber>;
                        totalReviews: z.ZodOptional<z.ZodNumber>;
                        reviews: z.ZodOptional<z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            author: z.ZodString;
                            rating: z.ZodNumber;
                            text: z.ZodOptional<z.ZodString>;
                            avatar: z.ZodOptional<z.ZodString>;
                        }, z.core.$strip>>>;
                        showStars: z.ZodOptional<z.ZodBoolean>;
                        compact: z.ZodOptional<z.ZodBoolean>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"FEATURE_LIST">;
                    props: z.ZodObject<{
                        title: z.ZodOptional<z.ZodString>;
                        features: z.ZodArray<z.ZodObject<{
                            id: z.ZodString;
                            icon: z.ZodOptional<z.ZodString>;
                            label: z.ZodString;
                        }, z.core.$strip>>;
                        iconColor: z.ZodOptional<z.ZodString>;
                        textColor: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"AWARD">;
                    props: z.ZodObject<{
                        variant: z.ZodOptional<z.ZodEnum<{
                            badge: "badge";
                            laurel: "laurel";
                            minimal: "minimal";
                        }>>;
                        title: z.ZodString;
                        subtitle: z.ZodOptional<z.ZodString>;
                        issuer: z.ZodOptional<z.ZodString>;
                        iconSrc: z.ZodOptional<z.ZodString>;
                        showLaurels: z.ZodOptional<z.ZodBoolean>;
                        backgroundColor: z.ZodOptional<z.ZodString>;
                        textColor: z.ZodOptional<z.ZodString>;
                    }, z.core.$loose>;
                }, z.core.$strip>, z.ZodObject<{
                    id: z.ZodString;
                    order: z.ZodNumber;
                    layout: z.ZodOptional<z.ZodObject<{
                        position: z.ZodOptional<z.ZodEnum<{
                            flow: "flow";
                            absolute: "absolute";
                        }>>;
                        x: z.ZodOptional<z.ZodNumber>;
                        y: z.ZodOptional<z.ZodNumber>;
                        width: z.ZodOptional<z.ZodNumber>;
                        height: z.ZodOptional<z.ZodNumber>;
                        rotation: z.ZodOptional<z.ZodNumber>;
                        zIndex: z.ZodOptional<z.ZodNumber>;
                        visible: z.ZodOptional<z.ZodBoolean>;
                        locked: z.ZodOptional<z.ZodBoolean>;
                        constraints: z.ZodOptional<z.ZodObject<{
                            horizontal: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            vertical: z.ZodOptional<z.ZodEnum<{
                                center: "center";
                                min: "min";
                                max: "max";
                                stretch: "stretch";
                            }>>;
                            keepAspectRatio: z.ZodOptional<z.ZodBoolean>;
                        }, z.core.$strip>>;
                    }, z.core.$loose>>;
                    type: z.ZodLiteral<"CUSTOM_COMPONENT">;
                    props: z.ZodObject<{
                        registryKey: z.ZodString;
                        payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
                    }, z.core.$loose>;
                }, z.core.$strip>], "type">>;
                branchRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    fieldKey: z.ZodString;
                    operator: z.ZodEnum<{
                        equals: "equals";
                        not_equals: "not_equals";
                        contains: "contains";
                        not_contains: "not_contains";
                        is_set: "is_set";
                        is_not_set: "is_not_set";
                    }>;
                    value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
                    targetScreenId: z.ZodString;
                }, z.core.$strip>>>;
                skipWhen: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    fieldKey: z.ZodString;
                    operator: z.ZodEnum<{
                        equals: "equals";
                        not_equals: "not_equals";
                        contains: "contains";
                        not_contains: "not_contains";
                        is_set: "is_set";
                        is_not_set: "is_not_set";
                    }>;
                    value: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>>;
                }, z.core.$strip>>>;
            }, z.core.$loose>>;
            settings: z.ZodOptional<z.ZodObject<{
                dismissible: z.ZodOptional<z.ZodBoolean>;
                showProgressBar: z.ZodOptional<z.ZodBoolean>;
                progressBarColor: z.ZodOptional<z.ZodString>;
                transitionAnimation: z.ZodOptional<z.ZodEnum<{
                    slide: "slide";
                    fade: "fade";
                    none: "none";
                }>>;
                showBackButton: z.ZodOptional<z.ZodBoolean>;
                showSkipButton: z.ZodOptional<z.ZodBoolean>;
                skipButtonLabel: z.ZodOptional<z.ZodString>;
            }, z.core.$loose>>;
        }, z.core.$loose>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const sdkErrorCodeSchema: z.ZodEnum<{
    FLOW_NOT_FOUND: "FLOW_NOT_FOUND";
    FLOW_NOT_PUBLISHED: "FLOW_NOT_PUBLISHED";
    INVALID_API_KEY: "INVALID_API_KEY";
    PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND";
}>;
export declare const sdkErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    code: z.ZodEnum<{
        FLOW_NOT_FOUND: "FLOW_NOT_FOUND";
        FLOW_NOT_PUBLISHED: "FLOW_NOT_PUBLISHED";
        INVALID_API_KEY: "INVALID_API_KEY";
        PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND";
    }>;
}, z.core.$strip>;
//# sourceMappingURL=schema.d.ts.map