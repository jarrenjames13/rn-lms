import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { BaseToast, BaseToastProps } from 'react-native-toast-message';

export const ToastConfig = {
    success: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#000000',
                backgroundColor: 'white',
                height: 'auto',
                minHeight: 70,
                paddingVertical: 10,
                zIndex: 9999,
                elevation: 9999,
            }}
            contentContainerStyle={{
                paddingHorizontal: 15,
            }}
            renderLeadingIcon={() => (
                <View style={{ position: 'relative', zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
            )}
            text1Style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
            }}
            text2Style={{
                fontSize: 14,
                color: '#4B5563',
            }}
        />
    ),
    error: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#000000',
                backgroundColor: 'white',
                height: 'auto',
                minHeight: 70,
                paddingVertical: 10,
                zIndex: 9999,
                elevation: 9999,
            }}
            contentContainerStyle={{
                paddingHorizontal: 15,
            }}
            renderLeadingIcon={() => (
                <View style={{ position: 'relative', zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="alert-circle" size={24} color="#EF4444" />
                </View>
            )}
            text1Style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
            }}
            text2Style={{
                fontSize: 14,
                color: '#4B5563',
            }}
        />
    ),
    info: (props: BaseToastProps) => (
        <BaseToast
            {...props}
            style={{
                borderLeftColor: '#000000',
                backgroundColor: 'white',
                height: 'auto',
                minHeight: 70,
                paddingVertical: 10,
                zIndex: 9999,
                elevation: 9999,
            }}
            contentContainerStyle={{
                paddingHorizontal: 15,
            }}
            renderLeadingIcon={() => (
                <View style={{ position: 'relative', zIndex: 9999 }} className="justify-center items-center pl-4">
                    <Ionicons name="information-circle" size={24} color="#F4BB44" />
                </View>
            )}
            text1Style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#111827',
            }}
            text2Style={{
                fontSize: 14,
                color: '#4B5563',
            }}
        />
    ),
} as const;