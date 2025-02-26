package org.lei.bill_buddy.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class StringToListUtil {
    public static List<String> toList(String string) {
        return new ArrayList<>(Arrays.asList(string.split(",")));
    }
}
