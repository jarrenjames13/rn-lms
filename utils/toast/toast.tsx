
import Toast from 'react-native-toast-message';

export const showToast = (props: {
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
}) => {
    Toast.show({
        type: props.type,
        text1: props.title,
        text2: props.message,
        position: 'top',
        visibilityTime: 2000,
        topOffset: 40
    });
};

