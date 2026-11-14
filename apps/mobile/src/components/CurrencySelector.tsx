import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { trpc } from '@/utils/trpc';
import BottomSheet from './ui/modal';
import { Input } from './ui/input';
import { Search } from 'lucide-react-native';

interface CurrencySelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    label?: string;
}

export function CurrencySelector({ value, onValueChange, label = "Select Currency" }: CurrencySelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { data: currencies, isLoading } = trpc.currency.list.useQuery();
    const { data: preferred } = trpc.currency.getPreferred.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
    const defaultCurrency = preferred?.defaultCurrency;

    // Forms start with an empty currency; fill it with the user's default from settings
    useEffect(() => {
        if (!value && defaultCurrency) {
            onValueChange(defaultCurrency);
        }
    }, [value, defaultCurrency, onValueChange]);

    type Currency = { code: string; name: string; symbol: string };
    type Row = { kind: 'header'; title: string } | { kind: 'currency'; currency: Currency };

    const rows = useMemo<Row[]>(() => {
        if (!currencies) return [];
        const list = currencies as Currency[];
        if (search) {
            const s = search.toLowerCase();
            return list
                .filter((c) => c.code.toLowerCase().includes(s) || c.name.toLowerCase().includes(s))
                .map((currency) => ({ kind: 'currency', currency }));
        }
        const suggestedCodes = [...new Set([defaultCurrency, ...(preferred?.recent || []), value].filter(Boolean))] as string[];
        const byCode = new Map(list.map((c) => [c.code, c]));
        const suggested = suggestedCodes.map((code) => byCode.get(code)).filter(Boolean) as Currency[];
        const others = list.filter((c) => !suggestedCodes.includes(c.code)).sort((a, b) => a.code.localeCompare(b.code));
        return [
            ...(suggested.length > 0 ? [{ kind: 'header', title: 'Suggested' } as Row] : []),
            ...suggested.map((currency) => ({ kind: 'currency', currency }) as Row),
            { kind: 'header', title: 'All currencies' } as Row,
            ...others.map((currency) => ({ kind: 'currency', currency }) as Row),
        ];
    }, [currencies, search, preferred, defaultCurrency, value]);

    const selectedCurrency = currencies?.find((c: any) => c.code === value);

    return (
        <View>
            <TouchableOpacity 
                onPress={() => setOpen(true)}
                className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex-row justify-between items-center"
            >
                <Text className="text-white font-medium">
                    {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : label}
                </Text>
                <Text className="text-zinc-500 text-xs">Tap to change</Text>
            </TouchableOpacity>

            <BottomSheet open={open} onClose={() => setOpen(false)}>
                <View className="mb-4 flex-row items-center bg-zinc-800 rounded-lg px-3">
                    <Search size={18} color="#9CA3AF" />
                    <Input 
                        placeholder="Search currencies..." 
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 border-0"
                        autoCapitalize="characters"
                    />
                </View>

                {isLoading ? (
                    <ActivityIndicator color="#8B5CF6" className="py-8" />
                ) : (
                    <FlatList
                        data={rows}
                        keyExtractor={(item) => (item.kind === 'header' ? `header-${item.title}` : item.currency.code)}
                        className="max-h-[400px]"
                        renderItem={({ item }) => item.kind === 'header' ? (
                            <Text className="px-1 pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                                {item.title}
                            </Text>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    onValueChange(item.currency.code);
                                    setOpen(false);
                                }}
                                className={`p-4 border-b border-zinc-800 flex-row justify-between items-center ${value === item.currency.code ? 'bg-zinc-800' : ''}`}
                            >
                                <View>
                                    <Text className="text-white font-bold">{item.currency.code} - {item.currency.name}</Text>
                                    <Text className="text-zinc-500 text-xs">{item.currency.symbol}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    {item.currency.code === defaultCurrency && (
                                        <View className="mr-2 rounded-full bg-violet-500/20 px-2 py-0.5">
                                            <Text className="text-[10px] font-bold text-violet-300">Default</Text>
                                        </View>
                                    )}
                                    {value === item.currency.code && (
                                        <View className="bg-green-500 h-2 w-2 rounded-full" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text className="text-center text-zinc-500 py-8">No currencies found</Text>
                        }
                    />
                )}
            </BottomSheet>
        </View>
    );
}
